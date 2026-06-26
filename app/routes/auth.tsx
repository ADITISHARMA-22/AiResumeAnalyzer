import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => [
  { title: "Resumind | Auth" },
  { name: "description", content: "Log into your account" },
];

const auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = new URLSearchParams(location.search).get("next") || "/";

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [auth.isAuthenticated, nextPath, navigate]);

  const handleAuthAction = async () => {
    if (auth.isAuthenticated) {
      await auth.signOut();
      return;
    }

    await auth.signIn();

    const authenticated = await auth.checkAuthStatus();
    if (authenticated) {
      navigate(nextPath, { replace: true });
      return;
    }

    window.setTimeout(() => {
      void auth.checkAuthStatus().then((isAuthed) => {
        if (isAuthed) {
          navigate(nextPath, { replace: true });
        }
      });
    }, 800);
  };

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Welcome</h1>
            <h2>Log In to Continue Your Job Journey</h2>
          </div>
          <div>
            {isLoading ? (
              <button className="auth-button animate-pulse">
                <p>Signing you in...</p>
              </button>
            ) : (
              <>
                {auth.isAuthenticated ? (
                  <button className="auth-button" onClick={handleAuthAction}>
                    <p>Log Out</p>
                  </button>
                ) : (
                  <button className="auth-button" onClick={handleAuthAction}>
                    <p>Log In</p>
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default auth;
