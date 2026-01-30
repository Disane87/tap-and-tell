import type { CreateGuestEntryInput, GuestAnswers, FavoriteSong, FavoriteVideo } from '~/types/guest'

/**
 * Composable for managing the multi-step guest entry wizard form.
 *
 * Manages 4 steps: Basics → Favorites → Fun → Message.
 * Steps 1 & 4 have required fields; steps 2 & 3 are optional.
 *
 * Uses module-level `ref()` to avoid SSR payload serialization.
 *
 * @returns Form state, validation, navigation, and submission helpers.
 */

const TOTAL_STEPS = 4
const MAX_NAME_LENGTH = 100
const MAX_MESSAGE_LENGTH = 1000
const MAX_TEXT_LENGTH = 500

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface WizardFormState {
  name: string
  photo: string | null
  favoriteColor: string
  favoriteFood: string
  favoriteMovie: string
  songTitle: string
  songArtist: string
  songUrl: string
  videoTitle: string
  videoUrl: string
  superpower: string
  hiddenTalent: string
  desertIslandItems: string
  coffeeOrTea: 'coffee' | 'tea' | null
  nightOwlOrEarlyBird: 'night_owl' | 'early_bird' | null
  beachOrMountains: 'beach' | 'mountains' | null
  bestMemory: string
  howWeMet: string
  message: string
}

interface FormValidation {
  name: string | null
  photo: string | null
  message: string | null
}

function createInitialState(): WizardFormState {
  return {
    name: '',
    photo: null,
    favoriteColor: '',
    favoriteFood: '',
    favoriteMovie: '',
    songTitle: '',
    songArtist: '',
    songUrl: '',
    videoTitle: '',
    videoUrl: '',
    superpower: '',
    hiddenTalent: '',
    desertIslandItems: '',
    coffeeOrTea: null,
    nightOwlOrEarlyBird: null,
    beachOrMountains: null,
    bestMemory: '',
    howWeMet: '',
    message: ''
  }
}

const currentStep = ref(0)
const direction = ref<'forward' | 'backward'>('forward')
const formState = ref<WizardFormState>(createInitialState())
const validation = ref<FormValidation>({ name: null, photo: null, message: null })
const status = ref<FormStatus>('idle')
const errorMessage = ref<string | null>(null)

/** Step labels for the progress indicator. */
const stepLabels = ['Basics', 'Favorites', 'Fun', 'Message']

export function useGuestForm() {
  /** Validates the current step's required fields. */
  function validateCurrentStep(): boolean {
    validation.value = { name: null, photo: null, message: null }

    if (currentStep.value === 0) {
      if (!formState.value.name.trim()) {
        validation.value.name = 'Name is required'
        return false
      }
      if (formState.value.name.length > MAX_NAME_LENGTH) {
        validation.value.name = `Name must be ${MAX_NAME_LENGTH} characters or less`
        return false
      }
    }

    if (currentStep.value === 3) {
      if (!formState.value.message.trim()) {
        validation.value.message = 'Message is required'
        return false
      }
      if (formState.value.message.length > MAX_MESSAGE_LENGTH) {
        validation.value.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
        return false
      }
    }

    return true
  }

  /** Validates all required fields across all steps. */
  function validate(): boolean {
    validation.value = { name: null, photo: null, message: null }
    let valid = true

    if (!formState.value.name.trim()) {
      validation.value.name = 'Name is required'
      valid = false
    }
    if (!formState.value.message.trim()) {
      validation.value.message = 'Message is required'
      valid = false
    }

    return valid
  }

  /** Advances to the next step if validation passes. */
  function nextStep(): void {
    if (!validateCurrentStep()) return
    if (currentStep.value < TOTAL_STEPS - 1) {
      direction.value = 'forward'
      currentStep.value++
    }
  }

  /** Goes back to the previous step. */
  function prevStep(): void {
    if (currentStep.value > 0) {
      direction.value = 'backward'
      currentStep.value--
    }
  }

  /**
   * Jumps to a specific step.
   * @param step - The target step index (0-based).
   */
  function goToStep(step: number): void {
    if (step >= 0 && step < TOTAL_STEPS) {
      direction.value = step > currentStep.value ? 'forward' : 'backward'
      currentStep.value = step
    }
  }

  /** Assembles the API submission payload from the current form state. */
  function getSubmitData(): CreateGuestEntryInput {
    const s = formState.value
    const answers: GuestAnswers = {}

    if (s.favoriteColor.trim()) answers.favoriteColor = s.favoriteColor.trim()
    if (s.favoriteFood.trim()) answers.favoriteFood = s.favoriteFood.trim()
    if (s.favoriteMovie.trim()) answers.favoriteMovie = s.favoriteMovie.trim()

    if (s.songTitle.trim()) {
      const song: FavoriteSong = { type: 'song', title: s.songTitle.trim() }
      if (s.songArtist.trim()) song.artist = s.songArtist.trim()
      if (s.songUrl.trim()) song.url = s.songUrl.trim()
      answers.favoriteSong = song
    }

    if (s.videoTitle.trim()) {
      const video: FavoriteVideo = { type: 'video', title: s.videoTitle.trim() }
      if (s.videoUrl.trim()) video.url = s.videoUrl.trim()
      answers.favoriteVideo = video
    }

    if (s.superpower.trim()) answers.superpower = s.superpower.trim()
    if (s.hiddenTalent.trim()) answers.hiddenTalent = s.hiddenTalent.trim()
    if (s.desertIslandItems.trim()) answers.desertIslandItems = s.desertIslandItems.trim()
    if (s.coffeeOrTea) answers.coffeeOrTea = s.coffeeOrTea
    if (s.nightOwlOrEarlyBird) answers.nightOwlOrEarlyBird = s.nightOwlOrEarlyBird
    if (s.beachOrMountains) answers.beachOrMountains = s.beachOrMountains
    if (s.bestMemory.trim()) answers.bestMemory = s.bestMemory.trim()
    if (s.howWeMet.trim()) answers.howWeMet = s.howWeMet.trim()

    const hasAnswers = Object.keys(answers).length > 0

    return {
      name: s.name.trim(),
      message: s.message.trim(),
      photo: s.photo || undefined,
      answers: hasAnswers ? answers : undefined
    }
  }

  /** Resets the entire form to its initial state. */
  function reset(): void {
    currentStep.value = 0
    direction.value = 'forward'
    formState.value = createInitialState()
    validation.value = { name: null, photo: null, message: null }
    status.value = 'idle'
    errorMessage.value = null
  }

  /**
   * Sets the form submission status.
   * @param s - The new status value.
   */
  function setStatus(s: FormStatus): void {
    status.value = s
  }

  /**
   * Sets an error message and marks the form as errored.
   * @param msg - The error message to display.
   */
  function setError(msg: string): void {
    status.value = 'error'
    errorMessage.value = msg
  }

  return {
    currentStep: readonly(currentStep),
    direction: readonly(direction),
    formState,
    validation: readonly(validation),
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    totalSteps: TOTAL_STEPS,
    stepLabels,
    validateCurrentStep,
    validate,
    nextStep,
    prevStep,
    goToStep,
    getSubmitData,
    reset,
    setStatus,
    setError
  }
}
