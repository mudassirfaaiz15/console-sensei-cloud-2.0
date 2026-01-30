import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { X } from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    targetSelector: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to ConsoleSensei! 👋',
        description: 'Let\'s take a quick tour of your AWS monitoring dashboard. This will only take a minute.',
        targetSelector: '[data-tour="dashboard-header"]',
        position: 'bottom',
    },
    {
        id: 'hygiene-score',
        title: 'Cloud Hygiene Score',
        description: 'This is your overall cloud health score. It measures security, cost efficiency, and best practices.',
        targetSelector: '[data-tour="hygiene-score"]',
        position: 'bottom',
    },
    {
        id: 'resources',
        title: 'Resource Overview',
        description: 'View all your AWS resources at a glance. Click any card to see detailed information.',
        targetSelector: '[data-tour="resources"]',
        position: 'top',
    },
    {
        id: 'alerts',
        title: 'Risk Alerts',
        description: 'Stay on top of potential issues. Critical alerts need immediate attention.',
        targetSelector: '[data-tour="alerts"]',
        position: 'left',
    },
    {
        id: 'command-palette',
        title: 'Pro Tip: Command Palette',
        description: 'Press Ctrl+K (or ⌘+K on Mac) to open the command palette. Navigate anywhere instantly!',
        targetSelector: '[data-tour="header"]',
        position: 'bottom',
    },
];

interface OnboardingTourProps {
    onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    const updatePosition = useCallback(() => {
        const target = document.querySelector(step.targetSelector);
        if (!target) {
            // If target not found, center the tooltip
            setPosition({
                top: window.innerHeight / 2 - 100,
                left: window.innerWidth / 2 - 175,
            });
            setTargetRect(null);
            return;
        }

        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        const tooltipHeight = 180;
        const tooltipWidth = 350;
        const padding = 16;

        let top = 0;
        let left = 0;

        switch (step.position) {
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'top':
                top = rect.top - tooltipHeight - padding;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.left - tooltipWidth - padding;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + padding;
                break;
        }

        // Keep within viewport
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

        setPosition({ top, left });
    }, [step]);

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStep, updatePosition]);

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-[100] pointer-events-none">
                {/* Semi-transparent backdrop with highlight cutout */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Highlight spotlight */}
                {targetRect && (
                    <div
                        className="absolute bg-transparent border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                        }}
                    />
                )}
            </div>

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="fixed z-[101] w-[350px] animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{ top: position.top, left: position.left }}
            >
                <Card className="border-primary/50 shadow-xl shadow-primary/10">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <Badge variant="secondary" className="text-xs">
                                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-2 -mt-1"
                                onClick={handleSkip}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={handleSkip}>
                                Skip tour
                            </Button>
                            <Button size="sm" onClick={handleNext}>
                                {isLastStep ? 'Get Started' : 'Next'}
                            </Button>
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-1.5 mt-4">
                            {ONBOARDING_STEPS.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentStep
                                            ? 'bg-primary'
                                            : index < currentStep
                                                ? 'bg-primary/50'
                                                : 'bg-muted'
                                        }`}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('consolesensei_onboarding_complete');
        if (!hasSeenOnboarding) {
            // Delay showing onboarding to let the page render
            const timer = setTimeout(() => setShowOnboarding(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem('consolesensei_onboarding_complete', 'true');
        setShowOnboarding(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem('consolesensei_onboarding_complete');
        setShowOnboarding(true);
    };

    return { showOnboarding, completeOnboarding, resetOnboarding };
}
