import { useState } from 'react';

export function useLocalChatState() {

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [sidebarPanelWidth, setSidebarPanelWidth] = useState(280);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const [editingName, setEditingName] = useState('');

  const [activeCampaignMenu, setActiveCampaignMenu] = useState<string | null>(null);

  const [clearModalOpen, setClearModalOpen] = useState(false);

  const [brandProfileModalOpen, setBrandProfileModalOpen] = useState(false);

  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [insightsOpen, setInsightsOpen] = useState(false);

  const [insightSections, setInsightSections] = useState({ quizProgress: true, quizAnswers: true, stage2Targets: true, metricsSnapshot: true, trends: true, activity: true });

  const [guidePopupOpen, setGuidePopupOpen] = useState(false);

  const [guideActiveTab, setGuideActiveTab] = useState<'overview' | 'stages' | 'panes' | 'metrics' | 'faq'>('overview');

  const [selectedPlanInChat, setSelectedPlanInChat] = useState<string | null>(null);

  const [newTactic, setNewTactic] = useState('');

  const [editQuizModalOpen, setEditQuizModalOpen] = useState(false);

  const [isStageBannerHidden, setIsStageBannerHidden] = useState(false);

  const [showAnalystScrollDown, setShowAnalystScrollDown] = useState(false);

  const [showContentScrollDown, setShowContentScrollDown] = useState(false);

  const [showSidebarBackToTop, setShowSidebarBackToTop] = useState(false);

  const [showInsightsBackToTop, setShowInsightsBackToTop] = useState(false);


  const [showConfirmModal, setShowConfirmModal] = useState(false);


  const [showTacticsDropdown, setShowTacticsDropdown] = useState(false);


  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const [phase2PopupOpen, setPhase2PopupOpen] = useState(false);

  const [phase2Step, setPhase2Step] = useState(0);

  const [phase2CustomOpen, setPhase2CustomOpen] = useState(false);

  const [phase2CustomInput, setPhase2CustomInput] = useState('');

  const [phase2TextInput, setPhase2TextInput] = useState('');

  return {
    sidebarOpen,
    setSidebarOpen,
    sidebarPanelWidth,
    setSidebarPanelWidth,
    userMenuOpen,
    setUserMenuOpen,
    editingCampaignId,
    setEditingCampaignId,
    editingName,
    setEditingName,
    activeCampaignMenu,
    setActiveCampaignMenu,
    clearModalOpen,
    setClearModalOpen,
    brandProfileModalOpen,
    setBrandProfileModalOpen,
    integrationsModalOpen,
    setIntegrationsModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingCampaignId,
    setDeletingCampaignId,
    copiedId,
    setCopiedId,
    insightsOpen,
    setInsightsOpen,
    insightSections,
    setInsightSections,
    guidePopupOpen,
    setGuidePopupOpen,
    guideActiveTab,
    setGuideActiveTab,
    selectedPlanInChat,
    setSelectedPlanInChat,
    newTactic,
    setNewTactic,
    editQuizModalOpen,
    setEditQuizModalOpen,
    isStageBannerHidden,
    setIsStageBannerHidden,
    showAnalystScrollDown,
    setShowAnalystScrollDown,
    showContentScrollDown,
    setShowContentScrollDown,
    showSidebarBackToTop,
    setShowSidebarBackToTop,
    showInsightsBackToTop,
    setShowInsightsBackToTop,
    showConfirmModal,
    setShowConfirmModal,
    showTacticsDropdown,
    setShowTacticsDropdown,
    glossaryOpen,
    setGlossaryOpen,
    phase2PopupOpen,
    setPhase2PopupOpen,
    phase2Step,
    setPhase2Step,
    phase2CustomOpen,
    setPhase2CustomOpen,
    phase2CustomInput,
    setPhase2CustomInput,
    phase2TextInput,
    setPhase2TextInput
  };
}
