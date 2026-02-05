/**
 * Unit tests for useGuestForm composable.
 *
 * Tests form validation, step navigation, and data building logic.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, reactive, computed, readonly } from 'vue'

// Mock Vue auto-imports that Nuxt provides
vi.stubGlobal('ref', ref)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

// Import after mocking globals
const { useGuestForm } = await import('../useGuestForm')

describe('useGuestForm', () => {
  beforeEach(() => {
    // Reset form state before each test
    const { reset } = useGuestForm()
    reset()
  })

  describe('initial state', () => {
    it('starts at step 1', () => {
      const { currentStep } = useGuestForm()
      expect(currentStep.value).toBe(1)
    })

    it('has empty form state', () => {
      const { formState } = useGuestForm()
      expect(formState.name).toBe('')
      expect(formState.message).toBe('')
      expect(formState.photo).toBeNull()
    })

    it('has 4 enabled steps by default', () => {
      const { enabledSteps, totalSteps } = useGuestForm()
      expect(enabledSteps.value).toEqual([1, 2, 3, 4])
      expect(totalSteps.value).toBe(4)
    })

    it('has idle status', () => {
      const { status } = useGuestForm()
      expect(status.value).toBe('idle')
    })
  })

  describe('validation - step 1 (basics)', () => {
    it('fails when name is empty', () => {
      const { formState, validateCurrentStep, errors } = useGuestForm()
      formState.name = ''
      expect(validateCurrentStep()).toBe(false)
      expect(errors.name).toBe('errors.nameRequired')
    })

    it('fails when name is only whitespace', () => {
      const { formState, validateCurrentStep, errors } = useGuestForm()
      formState.name = '   '
      expect(validateCurrentStep()).toBe(false)
      expect(errors.name).toBe('errors.nameRequired')
    })

    it('fails when name exceeds 100 characters', () => {
      const { formState, validateCurrentStep, errors } = useGuestForm()
      formState.name = 'a'.repeat(101)
      expect(validateCurrentStep()).toBe(false)
      expect(errors.name).toBe('errors.nameTooLong')
    })

    it('fails when photo exceeds size limit', () => {
      const { formState, validateCurrentStep, errors } = useGuestForm()
      formState.name = 'Test User'
      formState.photo = 'a'.repeat(7_000_001) // > 7MB base64
      expect(validateCurrentStep()).toBe(false)
      expect(errors.photo).toBe('errors.photoTooLarge')
    })

    it('passes with valid name', () => {
      const { formState, validateCurrentStep, errors } = useGuestForm()
      formState.name = 'Test User'
      expect(validateCurrentStep()).toBe(true)
      expect(errors.name).toBeUndefined()
    })
  })

  describe('validation - step 4 (message)', () => {
    it('fails when message is empty', () => {
      const { formState, validateCurrentStep, errors, goToStep, nextStep } = useGuestForm()
      // Go to step 4
      formState.name = 'Test'
      nextStep() // 1 -> 2
      nextStep() // 2 -> 3
      nextStep() // 3 -> 4

      formState.message = ''
      expect(validateCurrentStep()).toBe(false)
      expect(errors.message).toBe('errors.messageRequired')
    })

    it('fails when message exceeds 1000 characters', () => {
      const { formState, validateCurrentStep, errors, nextStep } = useGuestForm()
      formState.name = 'Test'
      nextStep()
      nextStep()
      nextStep()

      formState.message = 'a'.repeat(1001)
      expect(validateCurrentStep()).toBe(false)
      expect(errors.message).toBe('errors.messageTooLong')
    })

    it('passes with valid message', () => {
      const { formState, validateCurrentStep, nextStep } = useGuestForm()
      formState.name = 'Test'
      nextStep()
      nextStep()
      nextStep()

      formState.message = 'Hello World!'
      expect(validateCurrentStep()).toBe(true)
    })
  })

  describe('full form validation', () => {
    it('validates all required fields', () => {
      const { formState, validate, errors } = useGuestForm()
      formState.name = ''
      formState.message = ''

      expect(validate()).toBe(false)
      expect(errors.name).toBe('errors.nameRequired')
      expect(errors.message).toBe('errors.messageRequired')
    })

    it('passes with all required fields filled', () => {
      const { formState, validate } = useGuestForm()
      formState.name = 'Test User'
      formState.message = 'Hello!'

      expect(validate()).toBe(true)
    })
  })

  describe('step navigation', () => {
    it('moves to next step when current is valid', () => {
      const { formState, nextStep, currentStep } = useGuestForm()
      formState.name = 'Test User'
      expect(nextStep()).toBe(true)
      expect(currentStep.value).toBe(2)
    })

    it('does not move forward when step is invalid', () => {
      const { nextStep, currentStep } = useGuestForm()
      expect(nextStep()).toBe(false)
      expect(currentStep.value).toBe(1)
    })

    it('moves to previous step', () => {
      const { formState, nextStep, prevStep, currentStep } = useGuestForm()
      formState.name = 'Test'
      nextStep() // 1 -> 2
      expect(currentStep.value).toBe(2)
      prevStep() // 2 -> 1
      expect(currentStep.value).toBe(1)
    })

    it('does not go before step 1', () => {
      const { prevStep, currentStep } = useGuestForm()
      prevStep()
      expect(currentStep.value).toBe(1)
    })

    it('allows going back to previous steps without validation', () => {
      const { formState, nextStep, goToStep, currentStep } = useGuestForm()
      formState.name = 'Test'
      nextStep() // 1 -> 2
      nextStep() // 2 -> 3
      goToStep(1)
      expect(currentStep.value).toBe(1)
    })
  })

  describe('step index calculation', () => {
    it('calculates correct step index', () => {
      const { formState, nextStep, currentStepIndex } = useGuestForm()
      expect(currentStepIndex.value).toBe(1)

      formState.name = 'Test'
      nextStep()
      expect(currentStepIndex.value).toBe(2)
    })
  })

  describe('form config', () => {
    it('disables favorites step when configured', () => {
      const { applyFormConfig, enabledSteps } = useGuestForm()
      applyFormConfig({
        formConfig: { steps: { favorites: false, funFacts: true } }
      } as any)

      expect(enabledSteps.value).toEqual([1, 3, 4])
    })

    it('disables fun facts step when configured', () => {
      const { applyFormConfig, enabledSteps } = useGuestForm()
      applyFormConfig({
        formConfig: { steps: { favorites: true, funFacts: false } }
      } as any)

      expect(enabledSteps.value).toEqual([1, 2, 4])
    })

    it('adds step 5 when custom questions exist', () => {
      const { applyFormConfig, enabledSteps, customQuestions } = useGuestForm()
      applyFormConfig({
        customQuestions: [
          { id: 'q1', question: 'Test?', type: 'text', required: false }
        ]
      } as any)

      expect(enabledSteps.value).toContain(5)
      expect(customQuestions.value).toHaveLength(1)
    })
  })

  describe('buildAnswers', () => {
    it('returns undefined when no optional fields are filled', () => {
      const { formState, getSubmitData, reset } = useGuestForm()
      reset()
      formState.name = 'Test'
      formState.message = 'Hello'

      const data = getSubmitData()
      expect(data.answers).toBeUndefined()
    })

    it('includes filled favorites', () => {
      const { formState, getSubmitData, reset } = useGuestForm()
      reset()
      formState.name = 'Test'
      formState.message = 'Hello'
      formState.favoriteColor = 'Blue'
      formState.favoriteFood = 'Pizza'

      const data = getSubmitData()
      expect(data.answers?.favoriteColor).toBe('Blue')
      expect(data.answers?.favoriteFood).toBe('Pizza')
    })

    it('builds favorite song object correctly', () => {
      const { formState, getSubmitData, reset } = useGuestForm()
      reset()
      formState.name = 'Test'
      formState.message = 'Hello'
      formState.favoriteSongTitle = 'Bohemian Rhapsody'
      formState.favoriteSongArtist = 'Queen'

      const data = getSubmitData()
      expect(data.answers?.favoriteSong).toEqual({
        title: 'Bohemian Rhapsody',
        artist: 'Queen'
      })
    })

    it('includes fun facts', () => {
      const { formState, getSubmitData, reset } = useGuestForm()
      reset()
      formState.name = 'Test'
      formState.message = 'Hello'
      formState.coffeeOrTea = 'coffee'
      formState.superpower = 'Flying'

      const data = getSubmitData()
      expect(data.answers?.coffeeOrTea).toBe('coffee')
      expect(data.answers?.superpower).toBe('Flying')
    })

    it('trims whitespace from values', () => {
      const { formState, getSubmitData, reset } = useGuestForm()
      reset()
      formState.name = '  Test User  '
      formState.message = '  Hello World  '
      formState.favoriteColor = '  Blue  '

      const data = getSubmitData()
      expect(data.name).toBe('Test User')
      expect(data.message).toBe('Hello World')
      expect(data.answers?.favoriteColor).toBe('Blue')
    })
  })

  describe('status management', () => {
    it('sets status', () => {
      const { setStatus, status } = useGuestForm()
      setStatus('submitting')
      expect(status.value).toBe('submitting')
    })

    it('sets error with status', () => {
      const { setError, errors, status } = useGuestForm()
      setError('Something went wrong')
      expect(errors.general).toBe('Something went wrong')
      expect(status.value).toBe('error')
    })
  })

  describe('reset', () => {
    it('clears all form state', () => {
      const { formState, reset, currentStep, status } = useGuestForm()
      formState.name = 'Test'
      formState.message = 'Hello'
      formState.favoriteColor = 'Blue'

      reset()

      expect(formState.name).toBe('')
      expect(formState.message).toBe('')
      expect(formState.favoriteColor).toBe('')
      expect(currentStep.value).toBe(1)
      expect(status.value).toBe('idle')
    })
  })

  describe('isStepComplete', () => {
    it('returns true for step 1 when name is filled', () => {
      const { formState, isStepComplete } = useGuestForm()
      formState.name = 'Test'
      expect(isStepComplete(1)).toBe(true)
    })

    it('returns false for step 1 when name is empty', () => {
      const { formState, isStepComplete, reset } = useGuestForm()
      reset()
      expect(isStepComplete(1)).toBe(false)
    })

    it('returns true for optional steps', () => {
      const { isStepComplete } = useGuestForm()
      expect(isStepComplete(2)).toBe(true)
      expect(isStepComplete(3)).toBe(true)
    })

    it('returns true for step 4 when message is filled', () => {
      const { formState, isStepComplete } = useGuestForm()
      formState.message = 'Hello'
      expect(isStepComplete(4)).toBe(true)
    })
  })
})
