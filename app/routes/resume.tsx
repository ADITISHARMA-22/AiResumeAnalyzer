import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import { convertPdfToImage } from "~/lib/pdf2img";

export const meta = () => [
  { title: "Resumind | Review " },
  { name: "description", content: "Detailed overview of your resume" },
];

const emptyFeedback: Feedback = {
  overallScore: 0,
  ATS: { score: 0, tips: [] },
  toneAndStyle: { score: 0, tips: [] },
  content: { score: 0, tips: [] },
  structure: { score: 0, tips: [] },
  skills: { score: 0, tips: [] },
};

const normalizeFeedback = (value: unknown): Feedback => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = value as Partial<Feedback>;

    return {
      overallScore:
        typeof candidate.overallScore === "number" ? candidate.overallScore : 0,
      ATS: {
        score:
          typeof candidate.ATS?.score === "number" ? candidate.ATS.score : 0,
        tips: Array.isArray(candidate.ATS?.tips) ? candidate.ATS.tips : [],
      },
      toneAndStyle: {
        score:
          typeof candidate.toneAndStyle?.score === "number"
            ? candidate.toneAndStyle.score
            : 0,
        tips: Array.isArray(candidate.toneAndStyle?.tips)
          ? candidate.toneAndStyle.tips
          : [],
      },
      content: {
        score:
          typeof candidate.content?.score === "number"
            ? candidate.content.score
            : 0,
        tips: Array.isArray(candidate.content?.tips)
          ? candidate.content.tips
          : [],
      },
      structure: {
        score:
          typeof candidate.structure?.score === "number"
            ? candidate.structure.score
            : 0,
        tips: Array.isArray(candidate.structure?.tips)
          ? candidate.structure.tips
          : [],
      },
      skills: {
        score:
          typeof candidate.skills?.score === "number"
            ? candidate.skills.score
            : 0,
        tips: Array.isArray(candidate.skills?.tips)
          ? candidate.skills.tips
          : [],
      },
    };
  }

  return emptyFeedback;
};

const resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(emptyFeedback);
  const [hasFeedback, setHasFeedback] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated)
      navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      let resolvedImageUrl = "";
      const resume = await kv.get(`resume:${id}`);

      if (!resume) return;

      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) {
        setPreviewError("The uploaded PDF could not be loaded.");
        return;
      }

      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);

      const fallbackPreview = async () => {
        const previewResult = await convertPdfToImage(
          new File([pdfBlob], "resume.pdf", { type: "application/pdf" }),
        );

        if (previewResult.imageUrl) {
          resolvedImageUrl = previewResult.imageUrl;
          setImageUrl(resolvedImageUrl);
          setPreviewError("");
          return resolvedImageUrl;
        }

        setImageUrl("");
        setPreviewError(
          previewResult.error ||
            "Preview image is not available for this resume.",
        );
        return "";
      };

      if (data.imagePath) {
        try {
          const imageBlob = await fs.read(data.imagePath);
          if (imageBlob) {
            resolvedImageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(resolvedImageUrl);
            setPreviewError("");
          } else {
            await fallbackPreview();
          }
        } catch {
          setPreviewError("The preview image could not be loaded.");
          await fallbackPreview();
        }
      } else {
        await fallbackPreview();
      }

      const parsedFeedback = normalizeFeedback(data.feedback);
      setFeedback(parsedFeedback);
      setHasFeedback(
        parsedFeedback.overallScore > 0 ||
          parsedFeedback.ATS.score > 0 ||
          parsedFeedback.toneAndStyle.score > 0 ||
          parsedFeedback.content.score > 0 ||
          parsedFeedback.structure.score > 0 ||
          parsedFeedback.skills.score > 0,
      );
      console.log({
        resumeUrl,
        imageUrl: resolvedImageUrl,
        feedback: parsedFeedback,
      });
    };

    loadResume();
  }, [id]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit min-w-[320px] max-w-[720px]">
            {imageUrl ? (
              <a
                href={resumeUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            ) : (
              <div className="w-full h-full min-h-[420px] rounded-2xl border border-dashed border-gray-300 bg-white/80 p-8 flex flex-col items-center justify-center text-center">
                <img
                  src="/images/pdf.png"
                  alt="resume preview"
                  className="w-20 h-20 mb-4"
                />
                <p className="text-lg font-semibold text-gray-800">
                  Resume preview unavailable
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {previewError ||
                    "The uploaded resume preview could not be displayed."}
                </p>
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-sm font-medium text-blue-600 underline"
                  >
                    Open the PDF instead
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {hasFeedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          )}
        </section>
      </div>
    </main>
  );
};

export default resume;
