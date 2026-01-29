import type { CreateGuestEntryInput } from '~/types/guest'

/** Lifecycle status of the guest form submission. */
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

/** Reactive state for the guest submission form fields. */
export interface FormState {
  name: string
  message: string
  photo: string | null
}

/** Per-field validation error messages (`null` = valid). */
export interface FormValidation {
  name: string | null
  message: string | null
  photo: string | null
}

const MAX_NAME_LENGTH = 100
const MAX_MESSAGE_LENGTH = 1000
const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Composable for guest form state management and validation.
 *
 * Manages name, message, and photo fields with per-field validation,
 * submission lifecycle status, and helper methods.
 *
 * @returns Reactive form state, validation, status, and control functions.
 */
export function useGuestForm() {
  const formState = useState<FormState>('guest-form', () => ({
    name: '',
    message: '',
    photo: null
  }))

  const validation = useState<FormValidation>('guest-form-validation', () => ({
    name: null,
    message: null,
    photo: null
  }))

  const status = useState<FormStatus>('guest-form-status', () => 'idle')
  const errorMessage = useState<string | null>('guest-form-error', () => null)

  /**
   * Validates the guest name field.
   * @param value - The name to validate.
   * @returns An error message, or `null` if valid.
   */
  function validateName(value: string): string | null {
    if (!value.trim()) {
      return 'Name is required'
    }
    if (value.length > MAX_NAME_LENGTH) {
      return `Name must be ${MAX_NAME_LENGTH} characters or less`
    }
    return null
  }

  /**
   * Validates the guest message field.
   * @param value - The message to validate.
   * @returns An error message, or `null` if valid.
   */
  function validateMessage(value: string): string | null {
    if (!value.trim()) {
      return 'Message is required'
    }
    if (value.length > MAX_MESSAGE_LENGTH) {
      return `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
    }
    return null
  }

  /**
   * Validates an optional base64-encoded photo.
   * @param base64 - The base64 data URI, or `null` if no photo.
   * @returns An error message, or `null` if valid.
   */
  function validatePhoto(base64: string | null): string | null {
    if (!base64) return null

    // Check if it's a valid base64 image
    if (!base64.startsWith('data:image/')) {
      return 'Invalid image format'
    }

    // Estimate size (base64 is ~4/3 of original size)
    const sizeInBytes = (base64.length * 3) / 4
    if (sizeInBytes > MAX_PHOTO_SIZE) {
      return 'Photo must be 5MB or less'
    }

    return null
  }

  /**
   * Runs all field validations and updates the validation state.
   * @returns `true` if all fields are valid.
   */
  function validate(): boolean {
    validation.value = {
      name: validateName(formState.value.name),
      message: validateMessage(formState.value.message),
      photo: validatePhoto(formState.value.photo)
    }

    return !validation.value.name && !validation.value.message && !validation.value.photo
  }

  /** Sets the name field and clears its validation error. */
  function setName(value: string): void {
    formState.value.name = value
    validation.value.name = null
  }

  /** Sets the message field and clears its validation error. */
  function setMessage(value: string): void {
    formState.value.message = value
    validation.value.message = null
  }

  /** Sets the photo field (base64 data URI or `null`) and clears its validation error. */
  function setPhoto(base64: string | null): void {
    formState.value.photo = base64
    validation.value.photo = null
  }

  /** Resets all form fields, validation, and status to their initial state. */
  function reset(): void {
    formState.value = {
      name: '',
      message: '',
      photo: null
    }
    validation.value = {
      name: null,
      message: null,
      photo: null
    }
    status.value = 'idle'
    errorMessage.value = null
  }

  /** Returns the current form data shaped for the API submission payload. */
  function getSubmitData(): CreateGuestEntryInput {
    return {
      name: formState.value.name,
      message: formState.value.message,
      photo: formState.value.photo || undefined
    }
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

  const isValid = computed(() => {
    return formState.value.name.trim() !== '' &&
           formState.value.message.trim() !== '' &&
           !validation.value.name &&
           !validation.value.message &&
           !validation.value.photo
  })

  return {
    formState: readonly(formState),
    validation: readonly(validation),
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    isValid,
    setName,
    setMessage,
    setPhoto,
    validate,
    reset,
    getSubmitData,
    setStatus,
    setError,
    MAX_NAME_LENGTH,
    MAX_MESSAGE_LENGTH
  }
}
