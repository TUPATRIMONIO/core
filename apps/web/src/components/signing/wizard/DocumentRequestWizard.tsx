'use client'

import { SigningWizardProvider, useSigningWizard } from './WizardContext'
import { WizardProgress } from './WizardProgress'
import { CountryAndUploadStep } from './steps/CountryAndUploadStep'
import { ServiceSelectionStep } from './steps/ServiceSelectionStep'
import { SignerManagementStep } from './steps/SignerManagementStep'
import { CheckoutStep } from './steps/CheckoutStep'

export function DocumentRequestWizard() {
  return (
    <SigningWizardProvider>
      <WizardInner />
    </SigningWizardProvider>
  )
}

function WizardInner() {
  const {
    state: { step },
  } = useSigningWizard()

  return (
    <div className="space-y-4">
      <WizardProgress />

      {step === 0 && <CountryAndUploadStep />}
      {step === 1 && <ServiceSelectionStep />}
      {step === 2 && <SignerManagementStep />}
      {step === 3 && <CheckoutStep />}
    </div>
  )
}

