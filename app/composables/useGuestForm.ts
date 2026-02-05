import type { GuestAnswers, CreateGuestEntryInput, FavoriteSong, FavoriteVideo } from '~/types/guest'
import type { GuestbookSettings, CustomQuestion } from '~/types/guestbook'

/**
 * Form submission status.
 */
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Form state for the 4-step wizard.
 */
export interface GuestFormState {
  // Step 1: Basics (required)
  name: string
  photo: string | null

  // Step 2: Favorites (optional)
  favoriteColor: string
  favoriteFood: string
  favoriteMovie: string
  favoriteSongTitle: string
  favoriteSongArtist: string
  favoriteSongUrl: string
  favoriteVideoTitle: string
  favoriteVideoUrl: string

  // Step 3: Fun Facts (optional)
  superpower: string
  hiddenTalent: string
  desertIslandItems: string
  coffeeOrTea: 'coffee' | 'tea' | null
  nightOwlOrEarlyBird: 'night_owl' | 'early_bird' | null
  beachOrMountains: 'beach' | 'mountains' | null

  // Step 4: Message (required)
  message: string
  howWeMet: string
  bestMemory: string

  // Step 5: Custom Questions (dynamic)
  customAnswers: Record<string, string>
}

/**
 * Per-field validation errors.
 */
export interface FormErrors {
  name?: string
  photo?: string
  message?: string
  general?: string
  customAnswers?: Record<string, string>
}

/**
 * Default empty form state.
 */
function getDefaultState(): GuestFormState {
  return {
    name: '',
    photo: null,
    favoriteColor: '',
    favoriteFood: '',
    favoriteMovie: '',
    favoriteSongTitle: '',
    favoriteSongArtist: '',
    favoriteSongUrl: '',
    favoriteVideoTitle: '',
    favoriteVideoUrl: '',
    superpower: '',
    hiddenTalent: '',
    desertIslandItems: '',
    coffeeOrTea: null,
    nightOwlOrEarlyBird: null,
    beachOrMountains: null,
    message: '',
    howWeMet: '',
    bestMemory: '',
    customAnswers: {}
  }
}

/** All possible step numbers (5 = custom questions). */
const ALL_STEPS = [1, 2, 3, 4, 5] as const

/**
 * Module-level shared state for the form wizard.
 * This ensures all components share the same form state.
 */
const formState = reactive<GuestFormState>(getDefaultState())
const errors = reactive<FormErrors>({})
const status = ref<FormStatus>('idle')
const currentStep = ref(1)

/**
 * Enabled step numbers. Steps 1 (Basics) and 4 (Message) are always enabled.
 * Steps 2 (Favorites), 3 (Fun Facts), and 5 (Custom Questions) can be toggled via formConfig.
 */
const enabledSteps = ref<number[]>([1, 2, 3, 4])

/**
 * Active custom questions from guestbook settings.
 */
const customQuestions = ref<CustomQuestion[]>([])

/**
 * Composable for the 4-step guest form wizard.
 *
 * Steps:
 * 1. Basics - Name (required) and Photo (optional)
 * 2. Favorites - Color, Food, Movie, Song, Video (all optional)
 * 3. Fun Facts - Toggles and free text (all optional)
 * 4. Message - Message (required), How We Met, Best Memory (optional)
 *
 * State is shared across all components via module-level refs.
 *
 * @returns Form state, validation, step navigation, and submission helpers.
 */
export function useGuestForm() {
  /** Total number of enabled steps. */
  const totalSteps = computed(() => enabledSteps.value.length)

  /** Current position index within enabled steps (1-based for display). */
  const currentStepIndex = computed(() => {
    const idx = enabledSteps.value.indexOf(currentStep.value)
    return idx >= 0 ? idx + 1 : 1
  })

  /**
   * Applies guestbook settings to configure which steps are enabled.
   * Steps 1 (Basics) and 4 (Message) are always enabled.
   * Step 5 (Custom Questions) is enabled when custom questions are defined.
   */
  function applyFormConfig(settings?: GuestbookSettings): void {
    const steps: number[] = [1] // Basics always enabled
    const config = settings?.formConfig?.steps
    if (!config || config.favorites !== false) steps.push(2)
    if (!config || config.funFacts !== false) steps.push(3)
    steps.push(4) // Message always enabled

    // Add step 5 if custom questions exist
    const questions = settings?.customQuestions ?? []
    customQuestions.value = questions
    if (questions.length > 0) steps.push(5)

    enabledSteps.value = steps

    // If current step is disabled, go to step 1
    if (!enabledSteps.value.includes(currentStep.value)) {
      currentStep.value = 1
    }
  }

  /**
   * Validates the current step.
   * Step 1: name required, photo size limit.
   * Step 4: message required.
   *
   * Error values are i18n keys that should be translated by the component.
   *
   * @returns True if current step is valid.
   */
  function validateCurrentStep(): boolean {
    // Clear previous errors
    errors.name = undefined
    errors.photo = undefined
    errors.message = undefined
    errors.general = undefined
    errors.customAnswers = undefined

    if (currentStep.value === 1) {
      if (!formState.name.trim()) {
        errors.name = 'errors.nameRequired'
        return false
      }
      if (formState.name.length > 100) {
        errors.name = 'errors.nameTooLong'
        return false
      }
      // Photo size validation (5MB = ~6.67MB base64)
      if (formState.photo && formState.photo.length > 7_000_000) {
        errors.photo = 'errors.photoTooLarge'
        return false
      }
    }

    if (currentStep.value === 4) {
      if (!formState.message.trim()) {
        errors.message = 'errors.messageRequired'
        return false
      }
      if (formState.message.length > 1000) {
        errors.message = 'errors.messageTooLong'
        return false
      }
    }

    if (currentStep.value === 5) {
      // Validate required custom questions
      const customErrors: Record<string, string> = {}
      for (const q of customQuestions.value) {
        if (q.required && !formState.customAnswers[q.id]?.trim()) {
          customErrors[q.id] = 'errors.fieldRequired'
        }
      }
      if (Object.keys(customErrors).length > 0) {
        errors.customAnswers = customErrors
        return false
      }
    }

    return true
  }

  /**
   * Validates the entire form (all required fields).
   *
   * Error values are i18n keys that should be translated by the component.
   *
   * @returns True if form is valid for submission.
   */
  function validate(): boolean {
    errors.name = undefined
    errors.photo = undefined
    errors.message = undefined
    errors.general = undefined

    let valid = true

    if (!formState.name.trim()) {
      errors.name = 'errors.nameRequired'
      valid = false
    } else if (formState.name.length > 100) {
      errors.name = 'errors.nameTooLong'
      valid = false
    }

    if (formState.photo && formState.photo.length > 7_000_000) {
      errors.photo = 'errors.photoTooLarge'
      valid = false
    }

    if (!formState.message.trim()) {
      errors.message = 'errors.messageRequired'
      valid = false
    } else if (formState.message.length > 1000) {
      errors.message = 'errors.messageTooLong'
      valid = false
    }

    return valid
  }

  /**
   * Moves to the next enabled step if current step is valid.
   *
   * @returns True if navigation succeeded.
   */
  function nextStep(): boolean {
    if (!validateCurrentStep()) return false
    const idx = enabledSteps.value.indexOf(currentStep.value)
    if (idx < enabledSteps.value.length - 1) {
      currentStep.value = enabledSteps.value[idx + 1]
      return true
    }
    return false
  }

  /**
   * Moves to the previous enabled step.
   */
  function prevStep(): void {
    const idx = enabledSteps.value.indexOf(currentStep.value)
    if (idx > 0) {
      currentStep.value = enabledSteps.value[idx - 1]
    }
  }

  /**
   * Goes to a specific step (must be an enabled step).
   * Only allows going back, or forward if current step is valid.
   */
  function goToStep(step: number): void {
    if (!enabledSteps.value.includes(step)) return
    const targetIdx = enabledSteps.value.indexOf(step)
    const currentIdx = enabledSteps.value.indexOf(currentStep.value)
    if (targetIdx < currentIdx) {
      currentStep.value = step
    } else if (targetIdx > currentIdx && validateCurrentStep()) {
      currentStep.value = step
    }
  }

  /**
   * Builds the GuestAnswers object from form state.
   */
  function buildAnswers(): GuestAnswers | undefined {
    const answers: GuestAnswers = {}

    // Favorites
    if (formState.favoriteColor.trim()) answers.favoriteColor = formState.favoriteColor.trim()
    if (formState.favoriteFood.trim()) answers.favoriteFood = formState.favoriteFood.trim()
    if (formState.favoriteMovie.trim()) answers.favoriteMovie = formState.favoriteMovie.trim()

    if (formState.favoriteSongTitle.trim()) {
      const song: FavoriteSong = { title: formState.favoriteSongTitle.trim() }
      if (formState.favoriteSongArtist.trim()) song.artist = formState.favoriteSongArtist.trim()
      if (formState.favoriteSongUrl.trim()) song.url = formState.favoriteSongUrl.trim()
      answers.favoriteSong = song
    }

    if (formState.favoriteVideoTitle.trim()) {
      const video: FavoriteVideo = { title: formState.favoriteVideoTitle.trim() }
      if (formState.favoriteVideoUrl.trim()) video.url = formState.favoriteVideoUrl.trim()
      answers.favoriteVideo = video
    }

    // Fun Facts
    if (formState.superpower.trim()) answers.superpower = formState.superpower.trim()
    if (formState.hiddenTalent.trim()) answers.hiddenTalent = formState.hiddenTalent.trim()
    if (formState.desertIslandItems.trim()) answers.desertIslandItems = formState.desertIslandItems.trim()
    if (formState.coffeeOrTea) answers.coffeeOrTea = formState.coffeeOrTea
    if (formState.nightOwlOrEarlyBird) answers.nightOwlOrEarlyBird = formState.nightOwlOrEarlyBird
    if (formState.beachOrMountains) answers.beachOrMountains = formState.beachOrMountains

    // Our Story
    if (formState.howWeMet.trim()) answers.howWeMet = formState.howWeMet.trim()
    if (formState.bestMemory.trim()) answers.bestMemory = formState.bestMemory.trim()

    // Custom Answers
    const trimmedCustomAnswers: Record<string, string> = {}
    for (const [key, value] of Object.entries(formState.customAnswers)) {
      if (value?.trim()) {
        trimmedCustomAnswers[key] = value.trim()
      }
    }
    if (Object.keys(trimmedCustomAnswers).length > 0) {
      answers.customAnswers = trimmedCustomAnswers
    }

    return Object.keys(answers).length > 0 ? answers : undefined
  }

  /**
   * Gets the data ready for API submission.
   */
  function getSubmitData(): CreateGuestEntryInput {
    return {
      name: formState.name.trim(),
      message: formState.message.trim(),
      photo: formState.photo || undefined,
      answers: buildAnswers()
    }
  }

  /**
   * Sets the form status.
   */
  function setStatus(newStatus: FormStatus): void {
    status.value = newStatus
  }

  /**
   * Sets a general error message.
   */
  function setError(message: string): void {
    errors.general = message
    status.value = 'error'
  }

  /**
   * Resets the form to initial state.
   */
  function reset(): void {
    Object.assign(formState, getDefaultState())
    errors.name = undefined
    errors.photo = undefined
    errors.message = undefined
    errors.general = undefined
    errors.customAnswers = undefined
    status.value = 'idle'
    currentStep.value = 1
  }

  /**
   * Checks if a step has required fields filled.
   */
  function isStepComplete(step: number): boolean {
    if (step === 1) return !!formState.name.trim()
    if (step === 4) return !!formState.message.trim()
    return true // Steps 2 and 3 are optional
  }

  return {
    formState,
    errors,
    status: readonly(status),
    currentStep: readonly(currentStep),
    enabledSteps: readonly(enabledSteps),
    customQuestions: readonly(customQuestions),
    totalSteps,
    currentStepIndex,
    validateCurrentStep,
    validate,
    nextStep,
    prevStep,
    goToStep,
    getSubmitData,
    setStatus,
    setError,
    reset,
    isStepComplete,
    applyFormConfig
  }
}
