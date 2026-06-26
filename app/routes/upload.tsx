import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { AIResponseFormat, prepareInstructions } from "../../constants";

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

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText("Error: Failed to upload file");

    let uploadedImage;
    if (file.type?.includes("pdf")) {
      setStatusText("Preparing a preview for your resume...");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        setStatusText(
          `Preview unavailable: ${imageFile.error || "Failed to convert PDF to image"}`,
        );
      } else {
        if (imageFile.error) {
          setStatusText(
            "Preview generation had an issue, but the analysis will continue.",
          );
        }

        setStatusText("Uploading the preview...");
        uploadedImage = await fs.upload([imageFile.file]);
        if (!uploadedImage) {
          return setStatusText("Error: Failed to upload preview image");
        }
      }
    }

    if (!uploadedImage) {
      uploadedImage = { path: "" } as FSItem;
    }

    setStatusText("Preparing data...");
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path || "",
      companyName,
      jobTitle,
      jobDescription,
      feedback: emptyFeedback,
    } as Resume & { jobDescription: string };
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText("Analyzing your resume with AI...");

    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription }),
    );
    if (!feedback) return setStatusText("Error: Failed to analyze resume");

    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0]?.text || "";

    const cleanedFeedbackText = feedbackText
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      data.feedback = normalizeFeedback(JSON.parse(cleanedFeedbackText));
    } catch {
      data.feedback = emptyFeedback;
    }

    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analysis complete, redirecting...");
    console.log(data);
    navigate(`/resume/${uuid}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;

    const formData = new FormData(form);
    const companyName = (formData.get("company-name") as string) || "";
    const jobTitle = (formData.get("job-title") as string) || "";
    const jobDescription = (formData.get("job-description") as string) || "";

    if (!file) {
      setStatusText("Please upload a PDF resume before submitting.");
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};
export default Upload;
