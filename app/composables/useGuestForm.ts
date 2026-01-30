import type { CreateGuestEntryInput, GuestAnswers, FavoriteSong, FavoriteVideo } from '~/types/guest'

/** Lifecycle status of the guest form submission. */
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

/** All fields tracked by the multi-step wizard form. */
export interface WizardFormState {
  // Step 1: Basics
  name: string
  photo: string | null

  // Step 2: Favorites
  favoriteColor: string
  favoriteFood: string
  favoriteMovie: string
  favoriteSongTitle: string
  favoriteSongArtist: string
  favoriteSongUrl: string
  favoriteVideoTitle: string
  favoriteVideoUrl: string

  // Step 3: Fun
  superpower: string
  hiddenTalent: string
  desertIslandItems: string
  coffeeOrTea: 'coffee' | 'tea' | null
  nightOwlOrEarlyBird: 'night_owl' | 'early_bird' | null
  beachOrMountains: 'beach' | 'mountains' | null

  // Step 4: Message
  bestMemory: string
  howWeMet: string
  message: string
}

/** Per-field validation error messages (`null` = valid). */
export type FormValidation = Record<string, string | null>

export const TOTAL_STEPS = 4
export const MAX_NAME_LENGTH = 100
export const MAX_MESSAGE_LENGTH = 1000
export const MAX_TEXT_LENGTH = 500
const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Creates the default (empty) wizard form state.
 * @returns A fresh WizardFormState with all fields reset.
 */
function createDefaultState(): WizardFormState {
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
    bestMemory: '',
    howWeMet: '',
    message: ''
  }
}

// Module-level refs — NOT useState() — avoids SSR payload serialization
const currentStep = ref(0)
const direction = ref<'forward' | 'backward'>('forward')
const formState = ref<WizardFormState>(createDefaultState())
const validation = ref<FormValidation>({})
const status = ref<FormStatus>('idle')
const errorMessage = ref<string | null>(null)

/**
 * Composable for the multi-step guest form wizard.
 *
 * Manages a 4-step wizard (Basics, Favorites, Fun, Message) with per-step
 * validation, navigation controls, and submission data assembly.
 *
 * @returns Reactive form state, wizard controls, and submission helpers.
 */
export function useGuestForm() {
  /**
   * Validates Step 1 (Basics): name and photo.
   * @returns `true` if step 1 fields are valid.
   */
  function validateStep1(): boolean {
    const errors: FormValidation = {}
    if (!formState.value.name.trim()) {
      errors.name = 'Name is required'
    } else if (formState.value.name.length > MAX_NAME_LENGTH) {
      errors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`
    }
    if (formState.value.photo) {
      if (!formState.value.photo.startsWith('data:image/')) {
        errors.photo = 'Invalid image format'
      } else {
        const sizeInBytes = (formState.value.photo.length * 3) / 4
        if (sizeInBytes > MAX_PHOTO_SIZE) {
          errors.photo = 'Photo must be 5MB or less'
        }
      }
    }
    validation.value = errors
    return Object.values(errors).every(v => v === null || v === undefined)
  }

  /**
   * Validates Step 4 (Message): message is required.
   * @returns `true` if step 4 fields are valid.
   */
  function validateStep4(): boolean {
    const errors: FormValidation = {}
    if (!formState.value.message.trim()) {
      errors.message = 'Message is required'
    } else if (formState.value.message.length > MAX_MESSAGE_LENGTH) {
      errors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
    }
    validation.value = errors
    return Object.values(errors).every(v => v === null || v === undefined)
  }

  /**
   * Validates the current wizard step.
   * Steps 2 and 3 are entirely optional — they always pass.
   * @returns `true` if the current step is valid.
   */
  function validateCurrentStep(): boolean {
    if (currentStep.value === 0) return validateStep1()
    if (currentStep.value === 3) return validateStep4()
    // Steps 2 and 3 are optional — always valid
    validation.value = {}
    return true
  }

  /** Advances to the next step if validation passes. */
  function nextStep(): void {
    if (currentStep.value < TOTAL_STEPS - 1 && validateCurrentStep()) {
      direction.value = 'forward'
      currentStep.value++
    }
  }

  /** Returns to the previous step. */
  function prevStep(): void {
    if (currentStep.value > 0) {
      direction.value = 'backward'
      currentStep.value--
      validation.value = {}
    }
  }

  /**
   * Jumps to a specific step.
   * @param step - The step index (0–3).
   */
  function goToStep(step: number): void {
    if (step >= 0 && step < TOTAL_STEPS) {
      direction.value = step > currentStep.value ? 'forward' : 'backward'
      currentStep.value = step
      validation.value = {}
    }
  }

  /**
   * Validates all required fields across all steps.
   * @returns `true` if the form can be submitted.
   */
  function validate(): boolean {
    const errors: FormValidation = {}

    // Step 1 required
    if (!formState.value.name.trim()) {
      errors.name = 'Name is required'
    } else if (formState.value.name.length > MAX_NAME_LENGTH) {
      errors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`
    }

    // Step 4 required
    if (!formState.value.message.trim()) {
      errors.message = 'Message is required'
    } else if (formState.value.message.length > MAX_MESSAGE_LENGTH) {
      errors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
    }

    validation.value = errors
    return Object.values(errors).every(v => v === null || v === undefined)
  }

  /**
   * Assembles the form state into a `CreateGuestEntryInput` payload.
   * Empty/null optional fields are omitted from the answers object.
   * @returns The API submission payload.
   */
  function getSubmitData(): CreateGuestEntryInput {
    const answers: GuestAnswers = {}

    // Favorites
    if (formState.value.favoriteColor.trim())
      answers.favoriteColor = formState.value.favoriteColor.trim()
    if (formState.value.favoriteFood.trim())
      answers.favoriteFood = formState.value.favoriteFood.trim()
    if (formState.value.favoriteMovie.trim())
      answers.favoriteMovie = formState.value.favoriteMovie.trim()

    if (formState.value.favoriteSongTitle.trim()) {
      const song: FavoriteSong = {
        type: 'text',
        title: formState.value.favoriteSongTitle.trim()
      }
      if (formState.value.favoriteSongArtist.trim())
        song.artist = formState.value.favoriteSongArtist.trim()
      if (formState.value.favoriteSongUrl.trim())
        song.url = formState.value.favoriteSongUrl.trim()
      answers.favoriteSong = song
    }

    if (formState.value.favoriteVideoTitle.trim()) {
      const video: FavoriteVideo = {
        type: 'text',
        title: formState.value.favoriteVideoTitle.trim()
      }
      if (formState.value.favoriteVideoUrl.trim())
        video.url = formState.value.favoriteVideoUrl.trim()
      answers.favoriteVideo = video
    }

    // Fun
    if (formState.value.superpower.trim())
      answers.superpower = formState.value.superpower.trim()
    if (formState.value.hiddenTalent.trim())
      answers.hiddenTalent = formState.value.hiddenTalent.trim()
    if (formState.value.desertIslandItems.trim())
      answers.desertIslandItems = formState.value.desertIslandItems.trim()

    // Toggles
    if (formState.value.coffeeOrTea)
      answers.coffeeOrTea = formState.value.coffeeOrTea
    if (formState.value.nightOwlOrEarlyBird)
      answers.nightOwlOrEarlyBird = formState.value.nightOwlOrEarlyBird
    if (formState.value.beachOrMountains)
      answers.beachOrMountains = formState.value.beachOrMountains

    // Connection
    if (formState.value.bestMemory.trim())
      answers.bestMemory = formState.value.bestMemory.trim()
    if (formState.value.howWeMet.trim())
      answers.howWeMet = formState.value.howWeMet.trim()
    if (formState.value.message.trim())
      answers.messageToHost = formState.value.message.trim()

    const hasAnswers = Object.keys(answers).length > 0

    return {
      name: formState.value.name.trim(),
      message: formState.value.message.trim(),
      photo: formState.value.photo || undefined,
      answers: hasAnswers ? answers : undefined
    }
  }

  /** Resets the entire wizard to its initial state. */
  function reset(): void {
    formState.value = createDefaultState()
    validation.value = {}
    status.value = 'idle'
    errorMessage.value = null
    currentStep.value = 0
    direction.value = 'forward'
  }

  /** Updates the form lifecycle status. */
  function setStatus(newStatus: FormStatus): void {
    status.value = newStatus
  }

  /** Sets an error message and moves the form status to `'error'`. */
  function setError(message: string): void {
    errorMessage.value = message
    status.value = 'error'
  }

  /** Whether the form has enough data to submit (name + message filled). */
  const isValid = computed(() => {
    return formState.value.name.trim() !== '' &&
           formState.value.message.trim() !== ''
  })

  return {
    currentStep: readonly(currentStep),
    direction: readonly(direction),
    formState,
    validation: readonly(validation),
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    isValid,
    nextStep,
    prevStep,
    goToStep,
    validate,
    validateCurrentStep,
    getSubmitData,
    reset,
    setStatus,
    setError,
    TOTAL_STEPS,
    MAX_NAME_LENGTH,
    MAX_MESSAGE_LENGTH,
    MAX_TEXT_LENGTH
  }
}
