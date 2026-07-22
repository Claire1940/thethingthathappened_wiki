"use client";

import { useState, Suspense, lazy } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Compass,
  Flag,
  Gamepad2,
  HelpCircle,
  KeyRound,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
// import { SidebarAd } from "@/components/ads/SidebarAd"; // social bar 废弃广告位，保持注释不接回
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

// 模块顶部「眉标」胶囊：图标 + 小标签，统一各模块视觉风格
function ModuleEyebrow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 md:mb-6
                 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]"
    >
      <Icon className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
      <span className="text-xs md:text-sm font-medium uppercase tracking-wide">
        {children}
      </span>
    </div>
  );
}

// 模块标题区：眉标 + H2 标题 + 简介（所有模块共用）
function ModuleHeader({
  icon,
  eyebrow,
  title,
  intro,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="text-center mb-8 md:mb-12 scroll-reveal">
      <div className="flex justify-center">
        <ModuleEyebrow icon={icon}>{eyebrow}</ModuleEyebrow>
      </div>
      <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">
        {title}
      </h2>
      <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
        {intro}
      </p>
    </div>
  );
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  locale: string;
}

// Tools Grid 卡片索引 → 下方 section id 的一一映射（8 卡对应 8 模块）
const SECTION_IDS = [
  "beginner-guide",
  "walkthrough",
  "endings-guide",
  "characters-guide",
  "secrets-guide",
  "gameplay-guide",
  "release-guide",
  "faq",
] as const;

export default function HomePageClient({
  latestArticles,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.thethingthathappened.wiki";

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "The Thing That Happened Wiki",
        description:
          "Complete The Thing That Happened Wiki covering survival guides, weapons, crafting, locations, enemies, story, builds, and gameplay strategies for the post-apocalyptic Steam action adventure survival game.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "The Thing That Happened - Post-Apocalyptic Survival Action Adventure",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "The Thing That Happened Wiki",
        alternateName: "The Thing That Happened",
        url: siteUrl,
        description:
          "Complete The Thing That Happened Wiki resource hub for survival guides, weapons, crafting, locations, enemies, and story",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "The Thing That Happened Wiki - Post-Apocalyptic Survival Action Adventure",
        },
        sameAs: [
          "https://store.steampowered.com/app/2906500/The_Thing_That_Happened/",
          "https://steamcommunity.com/app/2906500",
          "https://www.youtube.com/@murklmario9084",
        ],
      },
      {
        "@type": "VideoGame",
        name: "The Thing That Happened",
        gamePlatform: ["PC", "Steam"],
        applicationCategory: "Game",
        genre: ["Survival", "Action", "Adventure"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 1,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://store.steampowered.com/app/2906500/The_Thing_That_Happened/",
        },
      },
      {
        "@type": "VideoObject",
        name: "The Thing That Happened | Official 1.0 Launch Trailer",
        description:
          "Official The Thing That Happened 1.0 launch trailer showcasing the post-apocalyptic survival action adventure gameplay.",
        uploadDate: "2024-04-10",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/sGrFAtPs5WQ",
        url: "https://www.youtube.com/watch?v=sGrFAtPs5WQ",
      },
    ],
  };

  // Accordion states（两个独立手风琴模块：endings / faq）
  const [endingsExpanded, setEndingsExpanded] = useState<number | null>(null);
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);
  const mobileBannerAd = getPreferredMobileBannerSelection();

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* social bar（SidebarAd）为废弃广告位，保持注释不接回 */}

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("beginner-guide")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://store.steampowered.com/app/2906500/The_Thing_That_Happened/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnSteamCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* Video Section（容器上限 max-w-5xl，避免挤压广告展示空间） */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="sGrFAtPs5WQ"
              title="The Thing That Happened | Official 1.0 Launch Trailer"
            />
          </div>
        </div>
      </section>

      {/* Tools Grid - 8 Navigation Cards（模块导航区，位于视频区之后、Latest Updates 之前） */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = SECTION_IDS[index];
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                                  bg-[hsl(var(--nav-theme)/0.1)]
                                  flex items-center justify-center
                                  group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                  transition-colors"
                  >
                    <DynamicIcon
                      name={card.icon}
                      className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm md:text-base font-semibold leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Updates Section（禁止删除/改动） */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Module 1: Beginner Guide（step-by-step） */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={BookOpen}
            eyebrow={t.modules.beginnerGuide.eyebrow}
            title={t.modules.beginnerGuide.title}
            intro={t.modules.beginnerGuide.intro}
          />
          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.beginnerGuide.steps.map((step: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                  <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* Module 2: Walkthrough（step-by-step） */}
      <section id="walkthrough" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Compass}
            eyebrow={t.modules.walkthrough.eyebrow}
            title={t.modules.walkthrough.title}
            intro={t.modules.walkthrough.intro}
          />
          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.walkthrough.steps.map((step: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                  <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 3: Endings Guide（accordion） */}
      <section id="endings-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Flag}
            eyebrow={t.modules.endingsGuide.eyebrow}
            title={t.modules.endingsGuide.title}
            intro={t.modules.endingsGuide.intro}
          />
          <div className="scroll-reveal space-y-2">
            {t.modules.endingsGuide.items.map((item: any, index: number) => (
              <div
                key={index}
                className="border border-border rounded-xl overflow-hidden bg-white/[0.02]"
              >
                <button
                  onClick={() =>
                    setEndingsExpanded(endingsExpanded === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold pr-3">{item.title}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[hsl(var(--nav-theme-light))] transition-transform ${endingsExpanded === index ? "rotate-180" : ""}`}
                  />
                </button>
                {endingsExpanded === index && (
                  <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 4: Characters Guide（card-list） */}
      <section id="characters-guide" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Users}
            eyebrow={t.modules.charactersGuide.eyebrow}
            title={t.modules.charactersGuide.title}
            intro={t.modules.charactersGuide.intro}
          />
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.charactersGuide.items.map((item: any, index: number) => (
              <div
                key={index}
                className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <h3 className="font-bold text-lg mb-2 text-[hsl(var(--nav-theme-light))]">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 5: 移动端横幅（中段阅读停顿） */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* Module 5: Secrets Guide（card-list） */}
      <section id="secrets-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={KeyRound}
            eyebrow={t.modules.secretsGuide.eyebrow}
            title={t.modules.secretsGuide.title}
            intro={t.modules.secretsGuide.intro}
          />
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.secretsGuide.items.map((item: any, index: number) => (
              <div
                key={index}
                className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <h3 className="font-bold text-lg mb-2 text-[hsl(var(--nav-theme-light))]">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 6: Gameplay Guide（card-list） */}
      <section id="gameplay-guide" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Gamepad2}
            eyebrow={t.modules.gameplayGuide.eyebrow}
            title={t.modules.gameplayGuide.title}
            intro={t.modules.gameplayGuide.intro}
          />
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.gameplayGuide.items.map((item: any, index: number) => (
              <div
                key={index}
                className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <h3 className="font-bold text-lg mb-2 text-[hsl(var(--nav-theme-light))]">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 7: Release Guide（table） */}
      <section id="release-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={Calendar}
            eyebrow={t.modules.releaseGuide.eyebrow}
            title={t.modules.releaseGuide.title}
            intro={t.modules.releaseGuide.intro}
          />
          <div className="scroll-reveal overflow-hidden rounded-xl border border-border max-w-3xl mx-auto">
            <table className="w-full">
              <tbody>
                {t.modules.releaseGuide.items.map((row: any, index: number) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white/[0.04]" : ""}
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4 font-semibold text-[hsl(var(--nav-theme-light))] w-2/5 align-top">
                      {row.field}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-muted-foreground">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Module 8: FAQ（accordion，问答均含主题名） */}
      <section id="faq" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            icon={HelpCircle}
            eyebrow={t.modules.faq.eyebrow}
            title={t.modules.faq.title}
            intro={t.modules.faq.intro}
          />
          <div className="scroll-reveal space-y-2 max-w-3xl mx-auto">
            {t.modules.faq.items.map((item: any, index: number) => (
              <div
                key={index}
                className="border border-border rounded-xl overflow-hidden bg-white/[0.02]"
              >
                <button
                  onClick={() =>
                    setFaqExpanded(faqExpanded === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold pr-3">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[hsl(var(--nav-theme-light))] transition-transform ${faqExpanded === index ? "rotate-180" : ""}`}
                  />
                </button>
                {faqExpanded === index && (
                  <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner（页脚前） */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://store.steampowered.com/app/2906500/The_Thing_That_Happened/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamStore}
                  </a>
                </li>
                <li>
                  <a
                    href="https://steamcommunity.com/app/2906500"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamCommunity}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@murklmario9084"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.youtube}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
