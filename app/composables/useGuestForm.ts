import type { GuestAnswers, CreateGuestEntryInput, FavoriteSong, FavoriteVideo } from '~/types/guest'

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
}

/**
 * Per-field validation errors.
 */
export interface FormErrors {
  name?: string
  photo?: string
  message?: string
  general?: string
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
    bestMemory: ''
  }
}

/**
 * Module-level shared state for the form wizard.
 * This ensures all components share the same form state.
 */
const formState = reactive<GuestFormState>(getDefaultState())
const errors = reactive<FormErrors>({})
const status = ref<FormStatus>('idle')
const currentStep = ref(1)
const totalSteps = 4

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
  /**
   * Validates the current step.
   * Step 1: name required, photo size limit.
   * Step 4: message required.
   *
   * @returns True if current step is valid.
   */
  function validateCurrentStep(): boolean {
    // Clear previous errors
    errors.name = undefined
    errors.photo = undefined
    errors.message = undefined
    errors.general = undefined

    if (currentStep.value === 1) {
      if (!formState.name.trim()) {
        errors.name = 'Name is required'
        return false
      }
      if (formState.name.length > 100) {
        errors.name = 'Name must be 100 characters or less'
        return false
      }
      // Photo size validation (5MB = ~6.67MB base64)
      if (formState.photo && formState.photo.length > 7_000_000) {
        errors.photo = 'Photo must be 5MB or less'
        return false
      }
    }

    if (currentStep.value === 4) {
      if (!formState.message.trim()) {
        errors.message = 'Message is required'
        return false
      }
      if (formState.message.length > 1000) {
        errors.message = 'Message must be 1000 characters or less'
        return false
      }
    }

    return true
  }

  /**
   * Validates the entire form (all required fields).
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
      errors.name = 'Name is required'
      valid = false
    } else if (formState.name.length > 100) {
      errors.name = 'Name must be 100 characters or less'
      valid = false
    }

    if (formState.photo && formState.photo.length > 7_000_000) {
      errors.photo = 'Photo must be 5MB or less'
      valid = false
    }

    if (!formState.message.trim()) {
      errors.message = 'Message is required'
      valid = false
    } else if (formState.message.length > 1000) {
      errors.message = 'Message must be 1000 characters or less'
      valid = false
    }

    return valid
  }

  /**
   * Moves to the next step if current step is valid.
   *
   * @returns True if navigation succeeded.
   */
  function nextStep(): boolean {
    if (!validateCurrentStep()) return false
    if (currentStep.value < totalSteps) {
      currentStep.value++
      return true
    }
    return false
  }

  /**
   * Moves to the previous step.
   */
  function prevStep(): void {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  /**
   * Goes to a specific step.
   * Only allows going back, or forward if current step is valid.
   */
  function goToStep(step: number): void {
    if (step < 1 || step > totalSteps) return
    if (step < currentStep.value) {
      currentStep.value = step
    } else if (step > currentStep.value && validateCurrentStep()) {
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
    totalSteps,
    validateCurrentStep,
    validate,
    nextStep,
    prevStep,
    goToStep,
    getSubmitData,
    setStatus,
    setError,
    reset,
    isStepComplete
  }
}
