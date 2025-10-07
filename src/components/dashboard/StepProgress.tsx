interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress = ({ currentStep, totalSteps }: StepProgressProps) => {
  return (
    <div className="flex items-center justify-center space-x-1 md:space-x-2 py-4 px-2 md:px-0">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isFuture = step > currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm transition-all ${
                  isCompleted
                    ? 'bg-[rgb(76,161,83)] text-white'
                    : isCurrent
                    ? 'bg-[hsl(var(--wizard-current-bg))] text-[hsl(var(--wizard-current-text))] ring-2 ring-[hsl(var(--wizard-current-bg))] ring-offset-2'
                    : 'bg-muted/15 text-black'
                }`}
              >
                {step}
              </div>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-6 md:w-12 h-1 mx-0.5 md:mx-1 ${
                  isCompleted ? 'bg-[rgb(76,161,83)]' : 'bg-[hsl(var(--wizard-future-bg))]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
