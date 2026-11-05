import { useEffect, useState } from 'react';
import { corpusLogin } from '../../services/api/auth';
import { useRouter } from '../../lib/router';
import { useConfigStore } from '../../stores/configStore';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

let introAlreadyShown = false;

export function CorpusLoginPage() {
  const setCorpusToken = useConfigStore((state) => state.setCorpusToken);
  const setAccessToken = useConfigStore((state) => state.setAccessToken);
  const { navigate } = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 800;
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      return isMobile && !introAlreadyShown && !prefersReduced;
    }
    return false;
  });
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const [revealForm, setRevealForm] = useState(false);

  // Show any error from GitLab OIDC redirect (/login?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gitlabError = params.get('error');
    if (gitlabError) {
      setError(`GitLab login failed: ${gitlabError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Gesture tracking states for manual swipe up
  const [startY, setStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (y: number, preventDefault?: () => void) => {
    if (preventDefault) preventDefault();
    setStartY(y);
    setIsDragging(true);
  };

  const handleMove = (y: number) => {
    if (!isDragging || startY === null || isSwipingUp) return;
    const diff = startY - y;
    if (diff > 0) {
      setDragOffset(diff);
    } else {
      setDragOffset(0);
    }
  };

  const handleEnd = () => {
    if (!isDragging || isSwipingUp) return;
    setIsDragging(false);
    setStartY(null);

    const threshold = window.innerHeight * 0.15; // 15% height threshold
    if (dragOffset > threshold) {
      setIsSwipingUp(true);
      setRevealForm(true);
      setTimeout(() => {
        setShowIntro(false);
        introAlreadyShown = true;
      }, 800);
    } else {
      setDragOffset(0);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone.trim() || !password.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('Connecting to server...');

    try {
      // Simulate multi-stage connection for visual clarity
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatusMessage('Authenticating with Corpus...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await corpusLogin(phone.trim(), password.trim());
      setStatusMessage('Finalizing session...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      setAccessToken(response.access_token);
      setCorpusToken('session', response.username || phone.trim());
      setPassword('');
      queryClient.invalidateQueries({ queryKey: ['session'] });
      navigate('/standup');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Corpus login failed'
      );
      setLoading(false);
      setStatusMessage(null);
    }
  }

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden p-0 font-body bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_60%_10%,rgba(14,165,233,0.1),transparent_30%),linear-gradient(135deg,#eef0fa_0%,#e8ecf5_40%,#eff0fa_100%)] bg-[size:200%_200%] animate-[login-gradient-shift_15s_ease_infinite] max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:items-center max-[800px]:overflow-y-auto max-[800px]:bg-slate-50">
      {showIntro && (
        <div
          role="presentation"
          /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
          className={`mobile-intro-overlay ${isSwipingUp ? 'swipe-up' : ''} select-none`}
          style={{
            transform: isSwipingUp
              ? 'translateY(-100%)'
              : isDragging
                ? `translateY(${-dragOffset}px)`
                : 'translateY(0)',
            transition: isDragging
              ? 'none'
              : 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onTouchStart={(e) => handleStart(e.touches[0].clientY)}
          onTouchMove={(e) => {
            if (e.cancelable) e.preventDefault();
            handleMove(e.touches[0].clientY);
          }}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => handleStart(e.clientY, () => e.preventDefault())}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleMove(e.clientY);
          }}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          <div className="mobile-intro-glow" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[10%] w-[6px] h-[6px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_12s_infinite_linear] [animation-delay:0.5s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[25%] w-[8px] h-[8px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_16s_infinite_linear] [animation-delay:3s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[40%] w-[5px] h-[5px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_10s_infinite_linear] [animation-delay:1.5s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[55%] w-[10px] h-[10px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_20s_infinite_linear] [animation-delay:5s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[70%] w-[7px] h-[7px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_14s_infinite_linear] [animation-delay:2.5s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[85%] w-[9px] h-[9px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_18s_infinite_linear] [animation-delay:4s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[18%] w-[6px] h-[6px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_11s_infinite_linear] [animation-delay:6.5s]" />
          <div className="mobile-intro-ember absolute -bottom-5 left-[60%] w-[8px] h-[8px] rounded-full pointer-events-none opacity-0 blur-[1.5px] will-change-[transform,opacity] bg-[radial-gradient(circle,rgba(147,197,253,0.8)_0%,rgba(56,189,248,0.3)_55%,transparent_100%)] animate-[floatEmber_15s_infinite_linear] [animation-delay:8s]" />
          <div className="mobile-intro-content">
            <p className="text-[#b7ccf6] font-display text-xs font-bold tracking-[0.18em] uppercase m-0 mb-4 text-center mobile-intro-label">
              INTERNSHIP ACTIVITY TRACKER
            </p>
            <h1 className="text-white font-display text-2xl font-bold tracking-[-0.03em] leading-tight m-0 mb-4 text-center max-w-[15ch] mobile-intro-headline">
              One portal for standup operations and Git compliance review.
            </h1>
            <p className="text-[rgba(228,238,255,0.9)] text-sm leading-relaxed m-0 text-center max-w-[28ch] mobile-intro-description">
              Sign in with Corpus to enter a unified workspace.
            </p>
          </div>
          <div className="mobile-intro-indicator">
            <div className="indicator-line" />
            <span className="indicator-text">Swipe up to Login</span>
          </div>
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_40%),linear-gradient(315deg,rgba(37,99,235,0.08),transparent_38%)]"
        aria-hidden="true"
      />
      <div className="relative w-screen h-screen overflow-hidden z-10 max-[800px]:flex max-[800px]:flex-col max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:w-full max-[800px]:overflow-visible">
        <section className="absolute left-0 top-0 w-[65vw] h-full z-20 flex flex-col justify-center gap-12 p-[60px_48px] text-[#f8fbff] [clip-path:polygon(0_0,100%_0,80%_100%,0_100%)] bg-[linear-gradient(145deg,#0b1220,#112d5c)] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-[1024px]:min-[801px]:w-[65vw] max-[1024px]:min-[801px]:p-[50px_36px] max-[800px]:hidden">
          <div className="relative z-10 pr-[12%] max-[800px]:pr-0 max-[800px]:pt-6">
            <p className="text-[#b7ccf6] font-display text-xs font-bold tracking-[0.18em] uppercase m-0 mb-2 max-w-[600px]">
              Internship Activity Tracker
            </p>
            <h1 className="text-white font-display text-[clamp(2.2rem,3.2vw,3.8rem)] font-bold tracking-[-0.04em] leading-[1.05] m-0 mb-3 max-w-[18ch] max-[1024px]:min-[801px]:text-[clamp(1.8rem,2.5vw,2.6rem)] max-[800px]:max-w-[12ch] max-[800px]:text-[2.3rem] max-[800px]:tracking-[-0.03em]">
              One portal for standup operations and Git compliance review.
            </h1>
            <p className="text-[rgba(228,238,255,0.9)] text-[15px] leading-relaxed m-0 mb-4 mr-auto max-w-[500px] relative z-10 max-[800px]:max-w-[28ch] max-[800px]:text-[14px] max-[800px]:leading-6">
              <span className="max-[800px]:hidden">
                Sign in with Corpus to enter a unified workspace. Standup
                Tracker handles daily submissions and verification, while Git
                Compliance Checker opens the GitLab-backed analytics and audit
                tools.
              </span>
              <span className="hidden max-[800px]:inline">
                Sign in once to manage standups, teams, and Git compliance.
              </span>
            </p>

            <div className="grid grid-cols-2 gap-5 mt-3 mr-auto max-w-[640px] relative z-10 max-[1024px]:min-[801px]:gap-3 max-[1024px]:min-[801px]:pt-5 max-[800px]:mt-6 max-[800px]:gap-2.5 max-[800px]:max-w-full">
              <article className="group relative flex flex-col p-[22px] rounded-2xl cursor-pointer backdrop-blur-md bg-[linear-gradient(135deg,rgba(15,23,42,0.4)_0%,rgba(30,41,59,0.2)_100%)] border border-[rgba(147,197,253,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-400 hover:translate-y-[-8px] hover:scale-[1.03] hover:border-[rgba(96,165,250,0.4)] hover:bg-[linear-gradient(135deg,rgba(20,30,55,0.6)_0%,rgba(37,99,235,0.1)_100%)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden [animation:card-entrance_0.8s_cubic-bezier(0.16,1,0.3,1)_both,card-idle-float_6s_infinite_ease-in-out_alternate] max-[1024px]:min-[801px]:p-3.5 max-[800px]:min-h-[104px] max-[800px]:p-3 max-[800px]:rounded-xl">
                <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -skew-x-[20deg] transition-none group-hover:left-[150%] group-hover:duration-800 group-hover:ease-in-out" />
                <span className="inline-flex w-fit px-3 py-1.5 mb-3.5 font-display text-[11px] font-bold tracking-widest text-[#93c5fd] bg-[rgba(96,165,250,0.1)] border border-[rgba(147,197,253,0.15)] rounded-full transition-all duration-300 group-hover:bg-[rgba(96,165,250,0.25)] group-hover:border-[rgba(147,197,253,0.4)] group-hover:text-white group-hover:shadow-[0_0_10px_rgba(96,165,250,0.3)] max-[800px]:mb-2 max-[800px]:px-2.5 max-[800px]:py-1 max-[800px]:text-[10px]">
                  01
                </span>
                <h2 className="text-white font-display text-lg font-semibold m-0 mb-2 transition-all duration-300 group-hover:text-[#60a5fa] max-[800px]:mb-0 max-[800px]:text-sm max-[800px]:leading-snug">
                  Standup Tracker
                </h2>
                <p className="text-[#94a3b8] text-[13.5px] leading-relaxed m-0 transition-all duration-300 group-hover:text-[#e2e8f0] max-[800px]:hidden">
                  Track standup uploads, verify team completion, review audio
                  evidence, and manage daily status from one operational
                  surface.
                </p>
              </article>

              <article className="group relative flex flex-col p-[22px] rounded-2xl cursor-pointer backdrop-blur-md bg-[linear-gradient(135deg,rgba(15,23,42,0.4)_0%,rgba(30,41,59,0.2)_100%)] border border-[rgba(147,197,253,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-400 hover:translate-y-[-8px] hover:scale-[1.03] hover:border-[rgba(96,165,250,0.4)] hover:bg-[linear-gradient(135deg,rgba(20,30,55,0.6)_0%,rgba(37,99,235,0.1)_100%)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden [animation:card-entrance_0.8s_cubic-bezier(0.16,1,0.3,1)_both,card-idle-float_6s_infinite_ease-in-out_alternate] max-[1024px]:min-[801px]:p-3.5 max-[800px]:min-h-[104px] max-[800px]:p-3 max-[800px]:rounded-xl">
                <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -skew-x-[20deg] transition-none group-hover:left-[150%] group-hover:duration-800 group-hover:ease-in-out" />
                <span className="inline-flex w-fit px-3 py-1.5 mb-3.5 font-display text-[11px] font-bold tracking-widest text-[#93c5fd] bg-[rgba(96,165,250,0.1)] border border-[rgba(147,197,253,0.15)] rounded-full transition-all duration-300 group-hover:bg-[rgba(96,165,250,0.25)] group-hover:border-[rgba(147,197,253,0.4)] group-hover:text-white group-hover:shadow-[0_0_10px_rgba(96,165,250,0.3)] max-[800px]:mb-2 max-[800px]:px-2.5 max-[800px]:py-1 max-[800px]:text-[10px]">
                  02
                </span>
                <h2 className="text-white font-display text-lg font-semibold m-0 mb-2 transition-all duration-300 group-hover:text-[#60a5fa] max-[800px]:mb-0 max-[800px]:text-sm max-[800px]:leading-snug">
                  Git Compliance Checker
                </h2>
                <p className="text-[#94a3b8] text-[13.5px] leading-relaxed m-0 transition-all duration-300 group-hover:text-[#e2e8f0] max-[800px]:hidden">
                  Add GitLab access after login to inspect developer activity,
                  weekly trends, team rankings, batch analytics, and roster
                  data.
                </p>
              </article>
            </div>
          </div>
        </section>

        <div
          className="relative z-30 hidden h-1.5 w-full bg-[linear-gradient(90deg,#1e40af_0%,#3b82f6_35%,#0ea5e9_50%,#3b82f6_65%,#1e40af_100%)] shadow-[0_0_18px_rgba(14,165,233,0.8)] max-[800px]:hidden"
          aria-hidden="true"
        />

        {/* Shadow depth cast behind the sidebar/glow onto the right panel */}
        <div
          className="absolute left-0 top-0 w-screen h-full pointer-events-none max-[800px]:hidden z-[15] [filter:drop-shadow(3px_0_6px_rgba(0,0,0,0.35))_drop-shadow(8px_0_16px_rgba(0,0,0,0.15))]"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-black [clip-path:polygon(0_0,65vw_0,52vw_100%,0_100%)]" />
        </div>

        {/* Glowing border slit separator */}
        <div
          className="absolute left-0 top-0 w-screen h-full pointer-events-none max-[800px]:hidden z-30 [filter:drop-shadow(0_0_6px_rgba(59,130,246,0.95))_drop-shadow(0_0_15px_rgba(14,165,233,0.65))]"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-[linear-gradient(to_bottom,#1e40af_0%,#3b82f6_20%,#0ea5e9_40%,#60a5fa_50%,#0ea5e9_60%,#3b82f6_80%,#1e40af_100%)] bg-[size:100%_200%] animate-[slit-glow-shimmer_4s_linear_infinite] [clip-path:polygon(calc(65vw_-_3px)_0,calc(65vw_+_3px)_0,calc(52vw_+_3px)_100%,calc(52vw_-_3px)_100%)]" />
        </div>

        <section className="absolute right-0 top-0 w-screen h-full z-10 flex flex-col items-center justify-center pl-[68vw] pr-[4vw] py-0 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%,#f1f5f9_100%)] overflow-hidden max-[1024px]:min-[801px]:pl-[68vw] max-[1024px]:min-[801px]:pr-[4vw] max-[800px]:relative max-[800px]:w-full max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:flex max-[800px]:items-center max-[800px]:justify-center max-[800px]:px-5 max-[800px]:py-9 max-[800px]:bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] max-[800px]:overflow-visible">
          <div
            className={`w-full max-w-[380px] flex flex-col gap-0 animate-[panel-fade-in_0.6s_cubic-bezier(0.16,1,0.3,1)_both] max-[800px]:max-w-[440px] max-[800px]:py-0 max-[800px]:my-0 max-[800px]:mx-auto mobile-login-reveal-container ${showIntro && !revealForm ? 'form-hidden' : ''} ${showIntro && revealForm ? 'form-reveal' : ''}`}
          >
            {/* Mobile Brand Header */}
            <div className="hidden max-[800px]:flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3b82f6_100%)] flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 animate-[pulse-border_2s_infinite_ease-in-out]">
                <svg
                  className="text-white"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-indigo-600 font-display text-[10px] font-bold tracking-[0.18em] uppercase">
                Swecha Internship
              </span>
              <h1 className="text-[#0f172a] font-display text-base font-bold tracking-tight mt-0.5">
                Activity Tracker
              </h1>
            </div>

            <div
              className="w-12 h-1 rounded-sm mb-5 bg-[linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc)] bg-[size:200%_100%] animate-[accent-shimmer_3s_ease-in-out_infinite] max-[800px]:mx-auto max-[800px]:mb-6"
              aria-hidden="true"
            />
            <div className="mb-7 max-[800px]:mb-5 max-[800px]:text-center">
              <h2 className="text-[#0f172a] font-display text-[clamp(26px,2.5vw,32px)] font-bold tracking-[-0.03em] leading-tight m-0 mb-2 max-[800px]:text-2xl">
                Login
              </h2>
              <p className="text-[#64748b] text-[14.5px] leading-relaxed m-0 max-[800px]:text-sm">
                Sign in with your Corpus credentials to access the internship
                workspace.
              </p>
            </div>

            <form className="grid gap-5 w-full" onSubmit={handleSubmit}>
              <div className="relative w-full group/field">
                <input
                  id="corpus-login-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    const cleaned = event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10);
                    setPhone(cleaned);
                  }}
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                  className="peer w-full min-h-[52px] bg-white border-[1.5px] border-[#e2e8f0] rounded-xl text-[#0f172a] text-sm p-[18px_14px_6px_42px] transition-all duration-200 focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus:outline-none"
                  placeholder=" "
                  required
                />
                <label
                  className="absolute left-[42px] top-1/2 -translate-y-1/2 text-sm font-medium text-[#64748b] pointer-events-none transition-all duration-200 origin-top-left peer-focus:top-[15px] peer-focus:scale-[0.8] peer-focus:text-[#2563eb] peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:scale-[0.8] peer-[:not(:placeholder-shown)]:text-[#64748b] peer-focus:peer-[:not(:placeholder-shown)]:text-[#2563eb]"
                  htmlFor="corpus-login-phone"
                >
                  Phone Number
                </label>
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none transition-all duration-200 peer-focus:text-[#2563eb] peer-focus:scale-[1.15] peer-focus:[filter:drop-shadow(0_0_4px_rgba(37,99,235,0.25))]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>

              <div className="relative w-full group/field">
                <input
                  id="corpus-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="peer w-full min-h-[52px] bg-white border-[1.5px] border-[#e2e8f0] rounded-xl text-[#0f172a] text-sm p-[18px_40px_6px_42px] transition-all duration-200 focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus:outline-none"
                  placeholder=" "
                  required
                />
                <label
                  className="absolute left-[42px] top-1/2 -translate-y-1/2 text-sm font-medium text-[#64748b] pointer-events-none transition-all duration-200 origin-top-left peer-focus:top-[15px] peer-focus:scale-[0.8] peer-focus:text-[#2563eb] peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:scale-[0.8] peer-[:not(:placeholder-shown)]:text-[#64748b] peer-focus:peer-[:not(:placeholder-shown)]:text-[#2563eb]"
                  htmlFor="corpus-login-password"
                >
                  Password
                </label>
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none transition-all duration-200 peer-focus:text-[#2563eb] peer-focus:scale-[1.15] peer-focus:[filter:drop-shadow(0_0_4px_rgba(37,99,235,0.25))]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] transition-all duration-150 p-1 flex items-center justify-center rounded-lg hover:bg-slate-50 focus:outline-none focus:text-[#2563eb]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error ? (
                <p className="bg-[linear-gradient(135deg,#fef2f2,#fff1f2)] border border-[#fecdd3] rounded-xl text-[#be123c] text-xs leading-relaxed m-0 p-[10px_14px]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group/btn relative flex items-center justify-center gap-2 w-full min-h-[48px] px-5 mt-1 rounded-xl text-white font-display text-sm font-bold tracking-[0.01em] bg-[linear-gradient(135deg,#0b1530_0%,#1e3b8a_50%,#2563eb_100%)] shadow-[0_4px_14px_rgba(30,58,138,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:enabled:shadow-[0_8px_24px_rgba(30,58,138,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:enabled:-translate-y-[1.5px] active:enabled:translate-y-0 disabled:opacity-65 disabled:cursor-wait overflow-hidden cursor-pointer border-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 rounded-full border-t-white animate-spin" />
                    {statusMessage || 'Loading…'}
                  </span>
                ) : (
                  <>
                    <span>Login with Corpus</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setStatusMessage('Launching Demo / Mock Mode...');
                  try {
                    const response = await corpusLogin('9876543210', 'demo123');
                    setAccessToken(response.access_token);
                    setCorpusToken('session', response.username || 'mock_lead');
                    queryClient.invalidateQueries({ queryKey: ['session'] });
                    navigate('/standup');
                  } catch (err) {
                    setError('Demo login failed');
                    setLoading(false);
                    setStatusMessage(null);
                  }
                }}
                disabled={loading}
                className="mt-3 w-full py-2.5 px-4 rounded-xl border border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                <span>⚡ Continue with Demo / Mock Account</span>
              </button>
            </form>

            <div className="mt-6">
              <div className="h-[1px] bg-[linear-gradient(90deg,transparent,#e2e8f0,transparent)] mb-4" />
              <p className="text-[#94a3b8] text-xs leading-relaxed m-0 mb-3 text-center">
                Corpus is the only required login to enter the product.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[#10b981] text-[11px] font-semibold tracking-[0.02em] opacity-80">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Secured by Corpus Authentication</span>
              </div>
            </div>

            {/* Mobile About Section Button & Toggle */}
            <div className="hidden max-[800px]:block mt-10 w-full text-center">
              <button
                type="button"
                onClick={() => setShowAbout(!showAbout)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95 focus:outline-none"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  {showAbout ? 'Hide About Platform' : 'About the Platform'}
                </span>
              </button>

              {showAbout && (
                <div className="flex flex-col gap-4 mt-6 text-left animate-[panel-fade-in_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
                  <article className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50/80">
                        01
                      </span>
                      <h4 className="text-slate-900 font-display font-bold text-sm">
                        Standup Tracker
                      </h4>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Track standup uploads, verify team completion, review
                      audio evidence, and manage daily status from one
                      operational surface.
                    </p>
                  </article>

                  <article className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50/80">
                        02
                      </span>
                      <h4 className="text-slate-900 font-display font-bold text-sm">
                        Git Compliance Checker
                      </h4>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Add GitLab access after login to inspect developer
                      activity, weekly trends, team rankings, batch analytics,
                      and roster data.
                    </p>
                  </article>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
