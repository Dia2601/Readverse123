import React, { useState, useEffect } from "react";
import { CosmicBackground } from "./components/CosmicBackground";
import { LandingGateway } from "./components/LandingGateway";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { CosmicHeader } from "./components/CosmicHeader";
import { CosmicWorldMap } from "./components/CosmicWorldMap";
import { ExplorePlanet } from "./components/planets/ExplorePlanet";
import { InvestigatePlanet } from "./components/planets/InvestigatePlanet";
import { DebatePlanet } from "./components/planets/DebatePlanet";
import { ConnectPlanet } from "./components/planets/ConnectPlanet";
import { CreatePlanet } from "./components/planets/CreatePlanet";
import { StoryReconstruction } from "./components/planets/StoryReconstruction";
import { PerspectiveDetailView } from "./components/planets/PerspectiveDetailView";
import { ReadingJourney } from "./components/ReadingJourney";
import { WeeklyRecommendations } from "./components/WeeklyRecommendations";
import { KomiCompanion } from "./components/KomiCompanion";
import { ROCKET_SKINS } from "./components/RocketAvatar";
import { Planet, UserProfile, WorkStatus, UserWorkItem, CreativePerspective } from "./types";
import { isSoundMuted, playPop, playSuccess, toggleSound, playTwinkle } from "./utils/audio";
import { PLANETS } from "./data/mockData";
import { deleteLocalPerspective } from "./utils/perspectiveManager";
import {
  createEmptyUserProfile,
  getStoredAccounts,
  getCurrentAccountId,
  saveAccountToStorage,
  setCurrentAccountId,
} from "./utils/accountManager";

export default function App() {
  // App primary stage
  const [appStage, setAppStage] = useState<"gateway" | "onboarding" | "universe">("gateway");

  // Universe views
  const [activeView, setActiveView] = useState<"map" | "journey" | "recommendations" | "planet" | "reconstruct" | "perspective-detail">("map");
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);

  // Creative Journey & Perspective state
  const [reconstructionWork, setReconstructionWork] = useState<string>("Vợ Nhặt");
  const [selectedPerspectiveDetail, setSelectedPerspectiveDetail] = useState<CreativePerspective | null>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!isSoundMuted());

  // User Profile
  const [user, setUser] = useState<UserProfile>(() => {
    const accounts = getStoredAccounts();
    const currentId = getCurrentAccountId();
    if (currentId) {
      const found = accounts.find((a) => a.id === currentId);
      if (found) return found;
    }
    if (accounts.length > 0) {
      return accounts[0];
    }
    return createEmptyUserProfile();
  });

  // Sync to local storage when user profile is updated
  useEffect(() => {
    if (user && user.name) {
      saveAccountToStorage(user);
    }
  }, [user]);

  const handleStartFromGateway = () => {
    setAppStage("onboarding");
  };

  const handleCompleteOnboarding = (profile: UserProfile) => {
    setUser(profile);
    setAppStage("universe");
    setActiveView("map");
  };

  const handleSelectPlanet = (planet: Planet) => {
    setActivePlanet(planet);
    setActiveView("planet");
  };

  const handleBackToMap = () => {
    setActivePlanet(null);
    setActiveView("map");
  };

  const handleToggleSoundEffect = () => {
    const nextState = toggleSound();
    setSoundEnabled(nextState);
  };

  const handleActivityComplete = (title: string, score: number, badge: string) => {
    playSuccess();
    setUser((prev) => ({
      ...prev,
      starsCount: prev.starsCount + 5,
      completedActivities: [
        {
          id: "act-" + Date.now(),
          activityTitle: title,
          planetId: activePlanet?.id || "explore",
          score,
          badgeEarned: badge,
          completedAt: "Vừa xong",
        },
        ...prev.completedActivities,
      ],
      stats: {
        analysis: Math.min(99, prev.stats.analysis + 1),
        multiPerspective: Math.min(99, prev.stats.multiPerspective + 1),
        criticalReasoning: Math.min(99, prev.stats.criticalReasoning + 1),
        connection: Math.min(99, prev.stats.connection + 1),
        creativity: Math.min(99, prev.stats.creativity + 1),
      },
    }));
  };

  const handleSaveToJourney = (bookTitle: string) => {
    const cleanTitle = (bookTitle || "").trim();
    if (!cleanTitle) return;
    if (!user.readWorks.some((rw) => (rw || "").toLowerCase().trim() === cleanTitle.toLowerCase())) {
      setUser((prev) => ({
        ...prev,
        starsCount: prev.starsCount + 3,
        readWorks: [...prev.readWorks, cleanTitle],
        workItems: [
          ...prev.workItems,
          {
            id: `wi-${Date.now()}`,
            title: cleanTitle,
            workTitle: cleanTitle,
            author: "Tác phẩm tuyển chọn",
            status: "read",
            dateAdded: "Hôm nay",
          },
        ],
      }));
    }
  };

  const handleUpdateWorkStatus = (title: string, author: string, status: WorkStatus) => {
    const cleanTitle = (title || "").trim();
    if (!cleanTitle) return;

    setUser((prev) => {
      const existingIdx = prev.workItems.findIndex(
        (w) => (w.title || w.workTitle || "").toLowerCase().trim() === cleanTitle.toLowerCase()
      );
      let updatedItems: UserWorkItem[];
      if (existingIdx >= 0) {
        updatedItems = [...prev.workItems];
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          status,
        };
      } else {
        updatedItems = [
          ...prev.workItems,
          {
            id: `wi-${Date.now()}`,
            title: cleanTitle,
            workTitle: cleanTitle,
            author: author || "Khuyết danh",
            status,
            dateAdded: "Hôm nay",
          },
        ];
      }

      // Update readWorks array in sync
      const nextReadWorks = status === "read"
        ? Array.from(new Set([...prev.readWorks, cleanTitle]))
        : prev.readWorks.filter((rw) => (rw || "").toLowerCase().trim() !== cleanTitle.toLowerCase());

      return {
        ...prev,
        readWorks: nextReadWorks,
        workItems: updatedItems,
      };
    });
  };

  const handleRemoveWorkItem = (title: string) => {
    const cleanTitle = (title || "").trim().toLowerCase();
    setUser((prev) => ({
      ...prev,
      readWorks: prev.readWorks.filter((rw) => (rw || "").toLowerCase().trim() !== cleanTitle),
      workItems: prev.workItems.filter((w) => (w.title || w.workTitle || "").toLowerCase().trim() !== cleanTitle),
    }));
  };

  const handleAddWorkItem = (title: string, author: string, status: WorkStatus) => {
    handleUpdateWorkStatus(title, author, status);
  };

  return (
    <CosmicBackground>
      {/* 1. GATEWAY STAGE */}
      {appStage === "gateway" && <LandingGateway onStart={handleStartFromGateway} />}

      {/* 2. ONBOARDING & ACCOUNT SETUP STAGE */}
      {appStage === "onboarding" && <OnboardingFlow onComplete={handleCompleteOnboarding} />}

      {/* 3. MAIN UNIVERSE EXPERIENCE */}
      {appStage === "universe" && (
        <div className="flex flex-col min-h-screen">
          {/* Cosmic Nav Header */}
          <CosmicHeader
            user={user}
            activeView={activeView}
            activePlanet={activePlanet}
            onNavigate={(view) => {
              setActivePlanet(null);
              setActiveView(view);
            }}
            onBackToMap={handleBackToMap}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSoundEffect}
            onSwitchAccount={(account) => {
              setUser(account);
              setCurrentAccountId(account.id);
            }}
            onCreateNewAccount={() => {
              setAppStage("onboarding");
            }}
          />

          {/* Universe Interactive View Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center">
            {activeView === "map" && (
              <CosmicWorldMap user={user} onSelectPlanet={handleSelectPlanet} />
            )}

            {activeView === "journey" && (
              <ReadingJourney
                user={user}
                onUpdateWorkStatus={handleUpdateWorkStatus}
                onAddWorkItem={handleAddWorkItem}
                onRemoveWorkItem={handleRemoveWorkItem}
              />
            )}

            {activeView === "recommendations" && (
              <WeeklyRecommendations user={user} onSaveToJourney={handleSaveToJourney} />
            )}

            {activeView === "reconstruct" && (
              <StoryReconstruction
                workTitle={reconstructionWork}
                currentUser={user}
                onBack={() => {
                  const createPlanet = PLANETS.find((p) => p.id === "create");
                  if (createPlanet) setActivePlanet(createPlanet);
                  setActiveView("planet");
                }}
                onNavigateToQuotesPlanet={() => {
                  const explore = PLANETS.find((p) => p.id === "explore");
                  if (explore) setActivePlanet(explore);
                  setActiveView("planet");
                }}
                onViewPublishedPerspective={(p) => {
                  setSelectedPerspectiveDetail(p);
                  setActivePlanet(null);
                  setActiveView("perspective-detail");
                }}
              />
            )}

            {activeView === "perspective-detail" && selectedPerspectiveDetail && (
              <PerspectiveDetailView
                perspective={selectedPerspectiveDetail}
                currentUser={user}
                onBack={() => {
                  const explore = PLANETS.find((p) => p.id === "explore");
                  if (explore) setActivePlanet(explore);
                  setActiveView("planet");
                }}
                onCreateYourOwnPerspective={(workTitle) => {
                  setReconstructionWork(workTitle || "Vợ Nhặt");
                  setActivePlanet(null);
                  setActiveView("reconstruct");
                }}
                onExploreOriginalWork={() => {
                  const explore = PLANETS.find((p) => p.id === "explore");
                  if (explore) setActivePlanet(explore);
                  setActiveView("planet");
                }}
                onDeletePerspective={(id) => {
                  deleteLocalPerspective(id);
                  setSelectedPerspectiveDetail(null);
                  const explore = PLANETS.find((p) => p.id === "explore");
                  if (explore) setActivePlanet(explore);
                  setActiveView("planet");
                }}
                onUpdatePerspective={(updated) => {
                  setSelectedPerspectiveDetail(updated);
                }}
              />
            )}

            {activeView === "planet" && activePlanet && (
              <div className="w-full">
                {activePlanet.id === "explore" && (
                  <ExplorePlanet
                    user={user}
                    onActivityComplete={handleActivityComplete}
                    onUpdateWorkStatus={handleUpdateWorkStatus}
                    onOpenReconstruction={(workTitle) => {
                      setReconstructionWork(workTitle || "Vợ Nhặt");
                      setActivePlanet(null);
                      setActiveView("reconstruct");
                    }}
                    onSelectPerspective={(p) => {
                      setSelectedPerspectiveDetail(p);
                      setActivePlanet(null);
                      setActiveView("perspective-detail");
                    }}
                  />
                )}
                {activePlanet.id === "investigate" && (
                  <InvestigatePlanet
                    user={user}
                    onActivityComplete={handleActivityComplete}
                    onAddReadWork={handleSaveToJourney}
                  />
                )}
                {activePlanet.id === "debate" && (
                  <DebatePlanet
                    user={user}
                    onActivityComplete={handleActivityComplete}
                    onAddReadWork={handleSaveToJourney}
                  />
                )}
                {activePlanet.id === "connect" && (
                  <ConnectPlanet
                    user={user}
                    onActivityComplete={handleActivityComplete}
                    onAddReadWork={handleSaveToJourney}
                    onAddConstellation={(c) => {
                      setUser((prev) => ({
                        ...prev,
                        starsCount: (prev.starsCount || 0) + 5,
                        createdConstellations: [c, ...(prev.createdConstellations || [])],
                      }));
                    }}
                  />
                )}
                {activePlanet.id === "create" && (
                  <CreatePlanet
                    user={user}
                    onActivityComplete={handleActivityComplete}
                    onAddReadWork={handleSaveToJourney}
                    onSaveCreation={(creation) => {
                      setUser((prev) => ({
                        ...prev,
                        starsCount: (prev.starsCount || 0) + 5,
                        savedCreations: [creation, ...(prev.savedCreations || [])],
                      }));
                    }}
                    onOpenStoryReconstruction={(workTitle) => {
                      setReconstructionWork(workTitle || "Vợ Nhặt");
                      setActivePlanet(null);
                      setActiveView("reconstruct");
                    }}
                    onNavigateToQuotesPlanet={() => {
                      const explore = PLANETS.find((p) => p.id === "explore");
                      if (explore) setActivePlanet(explore);
                      setActiveView("planet");
                    }}
                    onViewPerspectiveDetail={(p) => {
                      setSelectedPerspectiveDetail(p);
                      setActivePlanet(null);
                      setActiveView("perspective-detail");
                    }}
                  />
                )}
              </div>
            )}
          </main>

          {/* AI Cosmic Companion Komi */}
          <KomiCompanion
            astronautName={user.name}
            currentPlanetName={activePlanet ? activePlanet.name : "Trung tâm Ngân Hà"}
            contextText={
              activePlanet
                ? `Đang du hành tại ${activePlanet.name}: ${activePlanet.description}`
                : "Đang xem bản đồ Vũ Trụ READVERSE"
            }
          />
        </div>
      )}
    </CosmicBackground>
  );
}
