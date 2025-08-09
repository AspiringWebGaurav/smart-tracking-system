"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Icons } from '../design-system/components';
import { AssistantState, AIQuestion, ChatMessage } from '../types';
import EnterpriseNavigation from './EnterpriseNavigation';
import EnhancedPredefinedQuestions from './EnhancedPredefinedQuestions';
import EnhancedAIChat from './EnhancedAIChat';
import OptimizedJarvisAnimation from './OptimizedJarvisAnimation';
import OnboardingModal from './OnboardingModal';
import AnswerModal from './AnswerModal';
import { openRouterAPI, isAIEnabled, generateContextualPrompts, OpenRouterMessage } from '../utils/openRouterAPI';

interface EnterpriseAIAssistantProps {
  isPortfolioLoaded?: boolean;
  onAssistantStateChange?: (state: AssistantState) => void;
}

const EnterpriseAIAssistant: React.FC<EnterpriseAIAssistantProps> = ({
  isPortfolioLoaded = false,
  onAssistantStateChange
}) => {
  // Main state management
  const [assistantState, setAssistantState] = useState<AssistantState>({
    isVisible: false,
    isMinimized: false,
    activeTab: 'predefined',
    isLoading: false
  });

  // Navigation state
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  
  // Data state
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | undefined>();

  // AI state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Feature flags
  const [jarvisEnabled, setJarvisEnabled] = useState(true);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  // Answer modal state
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<AIQuestion | null>(null);

  // Client-side hydration check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load feature flags and onboarding state from localStorage
    try {
      const savedFlags = localStorage.getItem('ai-assistant-flags');
      if (savedFlags) {
        const flags = JSON.parse(savedFlags);
        setJarvisEnabled(flags.jarvisEnabled ?? true);
      }
      
      const savedOnboarding = localStorage.getItem('ai-assistant-onboarding');
      if (savedOnboarding) {
        const onboarding = JSON.parse(savedOnboarding);
        setHasSeenOnboarding(onboarding.seen ?? false);
      } else {
        setHasSeenOnboarding(false);
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      setHasSeenOnboarding(false);
    }

    // Check AI availability
    const checkAI = async () => {
      const aiAvailable = isAIEnabled();
      setAiEnabled(aiAvailable);
      
      if (aiAvailable) {
        try {
          const healthCheck = await openRouterAPI.checkHealth();
          if (!healthCheck) {
            console.warn('AI service health check failed');
            setAiEnabled(false);
          }
        } catch (error) {
          console.warn('AI service not available:', error);
          setAiEnabled(false);
        }
      }
    };

    checkAI();
  }, []);

  // Notify parent of state changes
  useEffect(() => {
    onAssistantStateChange?.(assistantState);
  }, [assistantState, onAssistantStateChange]);

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setAssistantState(prev => ({ ...prev, isLoading: true }));
      setError(undefined);
      
      // Fetch questions from Firebase via API
      const response = await fetch('/api/ai-assistant/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data?.questions)) {
        setQuestions(data.data.questions);
      } else if (data.fallback) {
        // Fallback to mock data if Firebase is unavailable
        console.warn('Firebase unavailable, using fallback data');
        const fallbackQuestions: AIQuestion[] = [
          {
            id: 'fallback-1',
            question: 'What projects has Gaurav worked on?',
            answer: 'Gaurav has worked on several impressive projects including a 3D Solar System visualization using Three.js, a video conferencing app called Yoom, an AI Image SaaS application similar to Canva, and an animated Apple iPhone 3D website. Each project demonstrates his expertise in modern web technologies like React, Next.js, TypeScript, and 3D graphics.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'fallback-2',
            question: 'What are his technical skills?',
            answer: 'Gaurav is proficient in a wide range of technologies including React, Next.js, TypeScript, Three.js, Tailwind CSS, Node.js, and various modern web development tools. He has experience with 3D graphics, real-time applications, AI integration, and responsive design. His portfolio showcases expertise in both frontend and full-stack development.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'fallback-3',
            question: 'How can I contact Gaurav?',
            answer: 'You can contact Gaurav through the contact form on his portfolio website. He is available for freelance projects, full-time opportunities, and collaboration. Feel free to reach out to discuss your project requirements or to learn more about his experience and availability.',
            createdAt: new Date().toISOString()
          }
        ];
        setQuestions(fallbackQuestions);
      } else {
        throw new Error(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load questions';
      setError(errorMessage);
      
      // Set empty array on error
      setQuestions([]);
    } finally {
      setAssistantState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'portfolio') {
      // Close assistant and return to portfolio
      handleClose();
      return;
    }
    
    setAssistantState(prev => ({
      ...prev,
      activeTab: tabId as 'predefined' | 'chat'
    }));
    setError(undefined);
  }, []);

  const handleQuestionClick = useCallback((question: AIQuestion) => {
    try {
      console.log('Question clicked:', question);
      
      // Handle anchor links safely (for navigation-type questions)
      if (question.anchorLink) {
        try {
          const element = document.querySelector(question.anchorLink);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (selectorError) {
          console.warn('Invalid anchor link selector:', question.anchorLink, selectorError);
        }
      }

      // Show answer modal for predefined questions
      // Note: File downloads are now handled only within the modal
      setSelectedQuestion(question);
      setShowAnswerModal(true);
      console.log('Answer modal should show now');
    } catch (error) {
      console.error('Error handling question click:', error);
      setError('Failed to process question. Please try again.');
    }
  }, []);

  const handleCloseAnswerModal = useCallback(() => {
    setShowAnswerModal(false);
    setSelectedQuestion(null);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setAssistantState(prev => ({ ...prev, isLoading: true }));
      setError(undefined);
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, userMessage]);

      // Generate contextual prompts based on user input
      const contextualPrompts = generateContextualPrompts(message);
      setSuggestedPrompts(contextualPrompts);
      
      if (aiEnabled) {
        // Use real AI with OpenRouter
        const conversationHistory: OpenRouterMessage[] = chatMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
        
        // Add current user message
        conversationHistory.push({
          role: 'user',
          content: message
        });

        const aiResponseContent = await openRouterAPI.sendMessage(conversationHistory);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: aiResponseContent,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback to mock response if AI is not available
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Thank you for your question: "${message}". I'm currently running in demo mode. To enable full AI functionality, please configure the OpenRouter API key. For now, you can explore the Quick Questions tab for immediate answers about Gaurav's portfolio and experience.`,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      
      // If AI fails, try fallback response
      if (aiEnabled) {
        try {
          const fallbackMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "I'm having trouble connecting to the AI service right now. Please try again in a moment, or feel free to explore the Quick Questions for immediate answers about Gaurav's portfolio.",
            role: 'assistant',
            timestamp: new Date().toISOString()
          };
          setChatMessages(prev => [...prev, fallbackMessage]);
          setError(undefined);
        } catch (fallbackError) {
          console.error('Fallback response failed:', fallbackError);
        }
      } else {
        // Add error message to chat for non-AI mode
        const errorChatMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again or check the Quick Questions tab.',
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, errorChatMessage]);
      }
    } finally {
      setAssistantState(prev => ({ ...prev, isLoading: false }));
    }
  }, [chatMessages, aiEnabled]);

  const handleShow = useCallback(() => {
    setAssistantState(prev => ({
      ...prev,
      isVisible: true,
      isMinimized: false
    }));
    
    // Show onboarding for first-time users
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [hasSeenOnboarding]);

  const handleClose = useCallback(() => {
    setAssistantState(prev => ({
      ...prev,
      isVisible: false,
      isMinimized: false
    }));
  }, []);

  const handleMinimize = useCallback(() => {
    setAssistantState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
  }, []);

  const toggleJarvis = useCallback(() => {
    const newState = !jarvisEnabled;
    setJarvisEnabled(newState);
    
    // Save to localStorage
    try {
      const flags = { jarvisEnabled: newState };
      localStorage.setItem('ai-assistant-flags', JSON.stringify(flags));
    } catch (error) {
      console.warn('Failed to save feature flags:', error);
    }
  }, [jarvisEnabled]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  }, []);

  const replayOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A to toggle assistant
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        if (assistantState.isVisible) {
          handleClose();
        } else {
          handleShow();
        }
      }

      // Escape to close assistant
      if (event.key === 'Escape' && assistantState.isVisible && !assistantState.isMinimized) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantState.isVisible, assistantState.isMinimized, handleShow, handleClose]);

  if (!isClient) return null;

  return (
    <>
      {/* Main Interface */}
      {assistantState.isVisible && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
              assistantState.isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            onClick={handleClose}
          />

          {/* Assistant Container */}
          <div
            className={cn(
              "fixed right-4 z-50 transition-all duration-500 ease-out rounded-2xl shadow-2xl overflow-hidden",
              "bg-ai-surface-primary/95 backdrop-blur-xl border border-ai-border-light/30",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none",
              assistantState.isMinimized
                ? "w-16 h-16 top-1/2 -translate-y-1/2"
                : "w-[850px] max-w-[95vw] h-[600px] max-h-[85vh] top-[8%]"
            )}
          >
            {assistantState.isMinimized ? (
              // Minimized State
              <div
                className="w-full h-full cursor-pointer flex items-center justify-center"
                onClick={handleMinimize}
              >
                {jarvisEnabled && (
                  <OptimizedJarvisAnimation
                    isActive={true}
                    size="small"
                    color="blue"
                    intensity="medium"
                  />
                )}
              </div>
            ) : (
              // Full Interface
              <div className="flex h-full">
                {/* Navigation Sidebar */}
                <EnterpriseNavigation
                  activeTab={assistantState.activeTab}
                  onTabChange={handleTabChange}
                  isCollapsed={isNavCollapsed}
                  onToggleCollapse={() => setIsNavCollapsed(!isNavCollapsed)}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-ai-border-light/30 bg-ai-surface-secondary/80 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      {jarvisEnabled && (
                        <OptimizedJarvisAnimation
                          isActive={true}
                          size="small"
                          color="blue"
                          intensity="medium"
                        />
                      )}
                      <div>
                        <h1 className="text-lg font-semibold text-ai-text-primary">
                          Gaurav's Personal Assistance
                        </h1>
                        <p className="text-xs text-ai-text-secondary">
                          AI-powered portfolio guide
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMinimize}
                        className="text-ai-text-tertiary hover:text-ai-text-primary"
                        title="Minimize (Ctrl+Shift+A)"
                      >
                        <Icons.ChevronRight className="w-4 h-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="text-ai-text-tertiary hover:text-ai-text-primary"
                        title="Close (Escape)"
                      >
                        <Icons.Close className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                      {assistantState.activeTab === 'predefined' && (
                        <EnhancedPredefinedQuestions
                          questions={questions}
                          onQuestionClick={handleQuestionClick}
                          isLoading={assistantState.isLoading}
                          error={error}
                        />
                      )}
                      
                      {assistantState.activeTab === 'chat' && (
                        <EnhancedAIChat
                          messages={chatMessages}
                          onSendMessage={handleSendMessage}
                          isLoading={assistantState.isLoading}
                          error={error}
                          aiEnabled={aiEnabled}
                          suggestedPrompts={suggestedPrompts}
                        />
                      )}

                      {assistantState.activeTab === 'settings' && (
                        <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                          <h2 className="text-lg font-semibold text-ai-text-primary mb-6">
                            Settings
                          </h2>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-ai-surface-secondary/50 border border-ai-border-light/30">
                              <div>
                                <h3 className="font-medium text-ai-text-primary">
                                  Jarvis Animation
                                </h3>
                                <p className="text-sm text-ai-text-secondary mt-1">
                                  Enable or disable the Jarvis animation effects
                                </p>
                              </div>
                              <Button
                                variant={jarvisEnabled ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={toggleJarvis}
                              >
                                {jarvisEnabled ? 'Enabled' : 'Disabled'}
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-lg bg-ai-surface-secondary/50 border border-ai-border-light/30">
                              <div>
                                <h3 className="font-medium text-ai-text-primary">
                                  Replay Tour
                                </h3>
                                <p className="text-sm text-ai-text-secondary mt-1">
                                  Show the onboarding tour again
                                </p>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={replayOnboarding}
                              >
                                Replay Tour
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-ai-border-light/30 bg-ai-surface-secondary/80 backdrop-blur-sm px-6 py-3">
                      <div className="flex items-center justify-between text-xs text-ai-text-muted">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              aiEnabled
                                ? "bg-green-500 animate-pulse"
                                : "bg-yellow-500"
                            )}></span>
                            <span>
                              {aiEnabled ? 'AI Assistant Online' : 'Demo Mode'}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            {aiEnabled ? 'Powered by OpenRouter AI' : 'Configure API for full AI'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Press Ctrl+Shift+A for quick access</span>
                          <span>•</span>
                          <span>ESC to close</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Action Button */}
      {!assistantState.isVisible && (
        <button
          onClick={handleShow}
          className="fixed top-1/2 right-6 -translate-y-1/2 z-40 group"
          title="Gaurav's Personal Assistant (Ctrl+Shift+A)"
          aria-label="Open AI Assistant"
        >
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-ai-primary-blue/30 via-ai-primary-blue-light/30 to-ai-primary-blue/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse"></div>

          {/* Main button with enhanced glass effect */}
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg">
            {/* Glass morphism background */}
            <div className="absolute inset-0 bg-ai-surface-primary/20 backdrop-blur-md border border-ai-primary-blue/50 rounded-full group-hover:bg-ai-surface-primary/30 group-hover:border-ai-primary-blue/70 transition-all duration-300"></div>
            
            {/* Inner glow */}
            <div className="absolute inset-1 bg-gradient-to-br from-ai-primary-blue/20 to-transparent rounded-full"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {jarvisEnabled ? (
                <OptimizedJarvisAnimation
                  isActive={true}
                  size="small"
                  color="blue"
                  intensity="medium"
                />
              ) : (
                <Icons.Chat className="w-6 h-6 text-ai-primary-blue" />
              )}
            </div>
          </div>
        </button>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />

      {/* Answer Modal */}
      <AnswerModal
        isVisible={showAnswerModal}
        question={selectedQuestion}
        onClose={handleCloseAnswerModal}
      />
    </>
  );
};

export default EnterpriseAIAssistant;