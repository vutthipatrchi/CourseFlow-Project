<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import courseFlowLogo from '../assets/admin/courseflow-sidebar-logo.svg'
import { clearUserRole } from '../auth/access'
import { addCourse, courses, updateCourse, type CourseLesson } from '../admin/courseStore'
import FormFieldError from '../components/admin/FormFieldError.vue'

const router = useRouter()
const route = useRoute()
const courseId = Number(route.params.id)
const courseToEdit = Number.isInteger(courseId)
  ? courses.value.find((course) => course.id === courseId)
  : undefined
const isEditing = route.name === 'admin-course-edit'

if (isEditing && !courseToEdit) void router.replace({ name: 'admin-courses' })

const name = ref(courseToEdit?.name ?? '')
const category = ref(courseToEdit?.category ?? '')
const price = ref(courseToEdit ? String(courseToEdit.price) : '')
const learningTime = ref<number | null>(courseToEdit?.learningTime ?? null)
const hasPromo = ref(courseToEdit?.hasPromo ?? !isEditing)
const promoCode = ref(courseToEdit?.promoCode ?? '')
const minimumPurchase = ref<number | null>(courseToEdit?.minimumPurchase ?? null)
const discount = ref<number | null>(courseToEdit?.discount ?? null)
const discountType = ref<'percentage' | 'fixed' | null>(courseToEdit?.discountType ?? null)
const summary = ref(courseToEdit?.summary ?? '')
const description = ref(courseToEdit?.description ?? '')
const imageName = ref(courseToEdit?.imageName ?? '')
const videoName = ref(courseToEdit?.videoName ?? '')
const resourceName = ref(courseToEdit?.resourceName ?? '')
type CourseFormField =
  | 'name'
  | 'price'
  | 'learningTime'
  | 'promoCode'
  | 'minimumPurchase'
  | 'discount'
  | 'summary'
  | 'description'
  | 'image'
const fieldErrors = ref<Partial<Record<CourseFormField, string>>>({})
const lessons = ref<CourseLesson[]>(
  courseToEdit?.lessonItems?.map((lesson) => ({ ...lesson })) ??
    Array.from({ length: courseToEdit?.lessons ?? 1 }, (_, index) => ({
      id: index + 1,
      name: index === 0 ? 'Introduction' : `Lesson ${index + 1}`,
      subLessons: 1,
    })),
)

function formatTimestamp(date: Date) {
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(' ', '')

  return `${datePart} ${timePart}`
}

function rememberFile(event: Event, target: 'image' | 'video' | 'resource') {
  const file = (event.target as HTMLInputElement).files?.[0]
  const value = file?.name ?? ''
  if (target === 'image') imageName.value = value
  if (target === 'video') videoName.value = value
  if (target === 'resource') resourceName.value = value
}

function addLesson() {
  const nextId = lessons.value.reduce((largest, lesson) => Math.max(largest, lesson.id), 0) + 1
  lessons.value.push({ id: nextId, name: `Lesson ${nextId}`, subLessons: 1 })
}

function removeLesson(id: number) {
  lessons.value = lessons.value.filter((lesson) => lesson.id !== id)
}

function clearError(field: CourseFormField) {
  const values: Record<CourseFormField, unknown> = {
    name: name.value,
    price: price.value,
    learningTime: learningTime.value,
    promoCode: promoCode.value,
    minimumPurchase: minimumPurchase.value,
    discount: discount.value,
    summary: summary.value,
    description: description.value,
    image: imageName.value,
  }

  if (!isEmpty(values[field])) delete fieldErrors.value[field]
}

function selectDiscountType() {
  discount.value = null
  if (fieldErrors.value.discount) {
    fieldErrors.value.discount = 'Please fill out this field'
  }
}

function validateDiscountInput() {
  if (isEmpty(discount.value)) {
    if (fieldErrors.value.discount) fieldErrors.value.discount = 'Please fill out this field'
    return
  }

  const value = Number(discount.value)
  if (!Number.isFinite(value) || value < 0) {
    fieldErrors.value.discount = 'Please enter numbers only'
  } else if (discountType.value === 'percentage' && value > 100) {
    fieldErrors.value.discount = 'Discount must not exceed 100%'
  } else {
    clearError('discount')
  }
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || (typeof value === 'string' && !value.trim())
}

function isValidPrice(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value.trim()) && Number(value) >= 0
}

function validatePriceInput() {
  if (isEmpty(price.value)) {
    if (fieldErrors.value.price) fieldErrors.value.price = 'Please fill out this field'
    return
  }

  if (!isValidPrice(price.value)) {
    fieldErrors.value.price = 'Please enter numbers only'
    return
  }

  clearError('price')
}

function validateCourse() {
  const errors: Partial<Record<CourseFormField, string>> = {}

  if (isEmpty(name.value)) errors.name = 'Please fill out this field'
  if (isEmpty(price.value)) {
    errors.price = 'Please fill out this field'
  } else if (!isValidPrice(price.value)) {
    errors.price = 'Please enter numbers only'
  }
  if (!isEditing && (isEmpty(learningTime.value) || !Number.isFinite(Number(learningTime.value)))) {
    errors.learningTime = 'Please fill out this field'
  }
  if (hasPromo.value && isEmpty(promoCode.value)) errors.promoCode = 'Please fill out this field'
  if (hasPromo.value && (isEmpty(minimumPurchase.value) || !Number.isFinite(Number(minimumPurchase.value)))) {
    errors.minimumPurchase = 'Please fill out this field'
  }
  if (hasPromo.value && !discountType.value) {
    errors.discount = 'Please select discount type'
  } else if (hasPromo.value && isEmpty(discount.value)) {
    errors.discount = 'Please fill out this field'
  } else if (hasPromo.value && (!Number.isFinite(Number(discount.value)) || Number(discount.value) < 0)) {
    errors.discount = 'Please enter numbers only'
  } else if (hasPromo.value && discountType.value === 'percentage' && Number(discount.value) > 100) {
    errors.discount = 'Discount must not exceed 100%'
  }
  if (!isEditing && isEmpty(summary.value)) errors.summary = 'Please fill out this field'
  if (!isEditing && isEmpty(description.value)) errors.description = 'Please fill out this field'
  if (!isEditing && isEmpty(imageName.value)) errors.image = 'Please fill out this field'

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

function focusLessonName(event: MouseEvent) {
  const row = (event.currentTarget as HTMLElement).closest('.lesson-row')
  row?.querySelector<HTMLInputElement>('input')?.focus()
}

async function saveCourse() {
  if (!validateCourse()) return

  const timestamp = formatTimestamp(new Date())
  const details = {
    name: name.value.trim(),
    lessons: lessons.value.length,
    price: Number(price.value),
    learningTime: learningTime.value,
    updatedAt: timestamp,
    category: category.value.trim(),
    hasPromo: hasPromo.value,
    promoCode: promoCode.value.trim(),
    minimumPurchase: minimumPurchase.value,
    discount: discount.value,
    discountType: discountType.value ?? undefined,
    summary: summary.value.trim(),
    description: description.value.trim(),
    imageName: imageName.value,
    videoName: videoName.value,
    resourceName: resourceName.value,
    lessonItems: lessons.value.map((lesson) => ({ ...lesson })),
  }

  if (isEditing && courseToEdit) {
    updateCourse(courseToEdit.id, details)
  } else {
    addCourse({ ...details, createdAt: timestamp, accent: '#dce8fb' })
  }

  await router.push({
    name: 'admin-courses',
    query: { [isEditing ? 'updated' : 'created']: name.value.trim() },
  })
}
</script>

<template>
  <div :class="['admin-layout', { 'create-mode': !isEditing }]">
    <aside class="sidebar">
      <div class="sidebar-header">
        <RouterLink class="brand" to="/">
          <img :src="courseFlowLogo" alt="CourseFlow" />
        </RouterLink>
        <p>Admin Panel Control</p>
      </div>

      <nav class="sidebar-nav" aria-label="Admin navigation">
        <RouterLink class="nav-item active" to="/admin/courses">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M12 6.04201C10.3516 4.56337 8.2144 3.74695 6 3.75001C4.948 3.75001 3.938 3.93001 3 4.26201V18.512C3.96362 18.172 4.97816 17.9989 6 18C8.305 18 10.408 18.867 12 20.292M12 6.04201C13.6483 4.56328 15.7856 3.74686 18 3.75001C19.052 3.75001 20.062 3.93001 21 4.26201V18.512C20.0364 18.172 19.0218 17.9989 18 18C15.7856 17.997 13.6484 18.8134 12 20.292M12 6.04201V20.292"
            />
          </svg>
          Course
        </RouterLink>
        <a class="nav-item" href="#assignments">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M11.35 3.836C11.285 4.046 11.25 4.269 11.25 4.5C11.25 4.914 11.586 5.25 12 5.25H16.5C16.6989 5.25 16.8897 5.17098 17.0303 5.03033C17.171 4.88968 17.25 4.69891 17.25 4.5C17.2501 4.27491 17.2164 4.05109 17.15 3.836M11.35 3.836C11.492 3.3767 11.7774 2.97493 12.1643 2.68954C12.5511 2.40414 13.0192 2.25011 13.5 2.25H15C16.012 2.25 16.867 2.918 17.15 3.836M11.35 3.836C10.974 3.859 10.6 3.886 10.226 3.916C9.095 4.01 8.25 4.973 8.25 6.108V8.25M17.15 3.836C17.526 3.859 17.9 3.886 18.274 3.916C19.405 4.01 20.25 4.973 20.25 6.108V16.5C20.25 17.0967 20.0129 17.669 19.591 18.091C19.169 18.5129 18.5967 18.75 18 18.75H15.75M8.25 8.25H4.875C4.254 8.25 3.75 8.754 3.75 9.375V20.625C3.75 21.246 4.254 21.75 4.875 21.75H14.625C15.246 21.75 15.75 21.246 15.75 20.625V18.75M8.25 8.25H14.625C15.246 8.25 15.75 8.754 15.75 9.375V18.75M7.5 15.75L9 17.25L12 13.5"
            />
          </svg>
          Assignment
        </a>
        <a class="nav-item" href="#promo-codes">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M8.18462 15.5385L15.8769 7.84615M2 17.8462C2 18.2536 2.16166 18.6445 2.44952 18.9329C2.73737 19.2214 3.12789 19.3838 3.53538 19.3846H20.4646C20.8721 19.3838 21.2626 19.2214 21.5505 18.9329C21.8383 18.6445 22 18.2536 22 17.8462V14.7169C21.3357 14.5368 20.7492 14.143 20.3311 13.5963C19.9129 13.0497 19.6863 12.3806 19.6863 11.6923C19.6863 11.0041 19.9129 10.3349 20.3311 9.78828C20.7492 9.24162 21.3357 8.84782 22 8.66769V5.53846C22 5.13097 21.8383 4.74012 21.5505 4.45169C21.2626 4.16326 20.8721 4.00081 20.4646 4H3.53538C3.12789 4.00081 2.73737 4.16326 2.44952 4.45169C2.16166 4.74012 2 5.13097 2 5.53846V8.66154C2.66957 8.83765 3.26197 9.23052 3.68471 9.77882C4.10744 10.3271 4.33671 11 4.33671 11.6923C4.33671 12.3846 4.10744 13.0575 3.68471 13.6058C3.26197 14.1541 2.66957 14.547 2 14.7231V17.8462Z"
            />
            <path
              d="M8.95478 9.38465C9.15879 9.38465 9.35445 9.30361 9.49871 9.15935C9.64296 9.01509 9.72401 8.81943 9.72401 8.61542C9.72401 8.41141 9.64296 8.21575 9.49871 8.07149C9.35445 7.92724 9.15879 7.84619 8.95478 7.84619C8.75076 7.84619 8.55511 7.92724 8.41085 8.07149C8.26659 8.21575 8.18555 8.41141 8.18555 8.61542C8.18555 8.81943 8.26659 9.01509 8.41085 9.15935C8.55511 9.30361 8.75076 9.38465 8.95478 9.38465ZM15.1086 15.5385C15.3126 15.5385 15.5083 15.4575 15.6526 15.3132C15.7968 15.1689 15.8779 14.9733 15.8779 14.7693C15.8779 14.5653 15.7968 14.3696 15.6526 14.2253C15.5083 14.0811 15.3126 14 15.1086 14C14.9046 14 14.709 14.0811 14.5647 14.2253C14.4204 14.3696 14.3394 14.5653 14.3394 14.7693C14.3394 14.9733 14.4204 15.1689 14.5647 15.3132C14.709 15.4575 14.9046 15.5385 15.1086 15.5385Z"
              stroke-width="1.5"
            />
          </svg>
          Promo code
        </a>
        <RouterLink class="nav-item logout" to="/" @click="clearUserRole">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
          </svg>
          Log out
        </RouterLink>
      </nav>
    </aside>

    <section class="workspace">
      <form novalidate @submit.prevent="saveCourse">
        <header class="topbar">
          <RouterLink
            v-if="isEditing"
            class="back-button"
            to="/admin/courses"
            aria-label="Back to courses"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>
          </RouterLink>
          <h1>
            <template v-if="isEditing"><span>Course</span> ‘{{ courseToEdit?.name }}’</template>
            <template v-else>Add Course</template>
          </h1>
          <div class="topbar-actions">
            <RouterLink class="cancel-button" to="/admin/courses">Cancel</RouterLink>
            <button class="save-button" type="submit">{{ isEditing ? 'Edit' : 'Create' }}</button>
          </div>
        </header>

        <main class="content">
          <section class="package-card" aria-label="Course details">
            <label class="field full-width" :class="{ 'has-error': fieldErrors.name }">
              <span>Course name <b aria-hidden="true">*</b></span>
              <input
                v-model.trim="name"
                name="courseName"
                type="text"
                placeholder="Enter course name"
                @input="clearError('name')"
              />
              <FormFieldError :message="fieldErrors.name" />
            </label>

            <div class="two-column">
              <label
                class="field"
                :class="{
                  'has-error': fieldErrors.price,
                  'has-invalid-value': fieldErrors.price === 'Please enter numbers only',
                }"
              >
                <span>Price <b aria-hidden="true">*</b></span>
                <input
                  v-model="price"
                  name="price"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]+([.][0-9]+)?"
                  placeholder="Enter price"
                  @input="validatePriceInput"
                />
                <FormFieldError
                  :message="fieldErrors.price"
                  :tone="fieldErrors.price === 'Please enter numbers only' ? 'warning' : 'error'"
                />
              </label>
              <label class="field" :class="{ 'has-error': fieldErrors.learningTime }">
                <span>Total learning time <b aria-hidden="true">*</b></span>
                <input
                  v-model.number="learningTime"
                  name="learningTime"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Total learning time"
                  @input="clearError('learningTime')"
                />
                <FormFieldError :message="fieldErrors.learningTime" />
              </label>
            </div>

            <section class="promo-section">
              <label class="check-row">
                <input v-model="hasPromo" name="hasPromo" type="checkbox" />
                <span>Promo code</span>
              </label>
              <div v-if="hasPromo" class="promo-panel">
                <div class="two-column">
                  <label class="field" :class="{ 'has-error': fieldErrors.promoCode }">
                    <span>Set promo code <b aria-hidden="true">*</b></span>
                    <input
                      v-model.trim="promoCode"
                      name="promoCode"
                      type="text"
                      placeholder="Enter promo code"
                      @input="clearError('promoCode')"
                    />
                    <FormFieldError :message="fieldErrors.promoCode" />
                  </label>
                  <label class="field" :class="{ 'has-error': fieldErrors.minimumPurchase }">
                    <span>Minimum purchase amount (THB) <b aria-hidden="true">*</b></span>
                    <input
                      v-model.number="minimumPurchase"
                      name="minimumPurchase"
                      type="number"
                      min="0"
                      placeholder="Minimum purchase amount"
                      @input="clearError('minimumPurchase')"
                    />
                    <FormFieldError :message="fieldErrors.minimumPurchase" />
                  </label>
                </div>
                <fieldset
                  :class="{
                    'has-error': fieldErrors.discount,
                    'has-invalid-value':
                      fieldErrors.discount === 'Discount must not exceed 100%' ||
                      fieldErrors.discount === 'Please enter numbers only',
                  }"
                >
                  <legend>Select discount type <b aria-hidden="true">*</b></legend>
                  <div class="radio-row discount-row">
                    <label>
                      <input
                        v-model="discountType"
                        name="discountType"
                        type="radio"
                        value="fixed"
                        @change="selectDiscountType"
                      />
                      Discount (THB)
                      <input
                        v-model.number="discount"
                        class="discount-input"
                        name="discount"
                        type="number"
                        min="0"
                        placeholder="THB"
                        :disabled="discountType !== 'fixed'"
                        @input="validateDiscountInput"
                      />
                    </label>
                    <label>
                      <input
                        v-model="discountType"
                        name="discountType"
                        type="radio"
                        value="percentage"
                        @change="selectDiscountType"
                      />
                      Discount (%)
                      <input
                        v-model.number="discount"
                        class="discount-input"
                        name="discount"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="%"
                        :disabled="discountType !== 'percentage'"
                        @input="validateDiscountInput"
                      />
                    </label>
                  </div>
                  <FormFieldError
                    :message="fieldErrors.discount"
                    :tone="
                      fieldErrors.discount === 'Discount must not exceed 100%' ||
                      fieldErrors.discount === 'Please enter numbers only'
                        ? 'warning'
                        : 'error'
                    "
                  />
                </fieldset>
              </div>
            </section>

            <label class="field full-width" :class="{ 'has-error': fieldErrors.summary }">
              <span>Course summary <b aria-hidden="true">*</b></span>
              <textarea
                v-model.trim="summary"
                name="summary"
                rows="2"
                placeholder="Course summary"
                @input="clearError('summary')"
              ></textarea>
              <FormFieldError :message="fieldErrors.summary" />
            </label>

            <label class="field full-width" :class="{ 'has-error': fieldErrors.description }">
              <span>Course detail <b aria-hidden="true">*</b></span>
              <textarea
                v-model.trim="description"
                name="description"
                rows="7"
                placeholder="Course detail"
                @input="clearError('description')"
              ></textarea>
              <FormFieldError :message="fieldErrors.description" />
            </label>

            <div class="upload-grid">
              <label class="upload-field" :class="{ 'has-error': fieldErrors.image }">
                <span>Cover image <b aria-hidden="true">*</b></span>
                <small>Supported file types: .jpg, .png, .jpeg. Max file size: 5 MB</small>
                <span class="upload-box">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 16V4M7 9l5-5 5 5M5 15v5h14v-5" />
                  </svg>
                  {{ imageName || 'Upload Image' }}
                  <input
                    name="coverImage"
                    type="file"
                    accept="image/*"
                    @change="rememberFile($event, 'image'); clearError('image')"
                  />
                </span>
                <FormFieldError :message="fieldErrors.image" />
              </label>
              <label class="upload-field">
                <span>Preview video</span>
                <small>Upload an introduction video</small>
                <span class="upload-box">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 16V4M7 9l5-5 5 5M5 15v5h14v-5" />
                  </svg>
                  {{ videoName || 'Upload Video' }}
                  <input type="file" accept="video/*" @change="rememberFile($event, 'video')" />
                </span>
              </label>
              <label class="upload-field compact-upload attach-file-field">
                <span>Attach File (Optional)</span>
                <span class="upload-box attach-file-box">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 6v12M6 12h12" />
                  </svg>
                  {{ resourceName || 'Upload file' }}
                  <input
                    name="attachment"
                    type="file"
                    @change="rememberFile($event, 'resource')"
                  />
                </span>
              </label>
            </div>
          </section>

          <section class="lessons-section">
            <div class="section-heading">
              <h2>Lesson</h2>
              <button class="add-lesson-button" type="button" @click="addLesson">Add Lesson</button>
            </div>
            <div class="lesson-table">
              <div class="lesson-head">
                <span>#</span><span>Lesson name</span><span>Sub-lesson</span><span>Action</span>
              </div>
              <div v-for="(lesson, index) in lessons" :key="lesson.id" class="lesson-row">
                <span>{{ index + 1 }}</span>
                <input v-model.trim="lesson.name" :aria-label="`Lesson ${index + 1} name`" />
                <input
                  v-model.number="lesson.subLessons"
                  type="number"
                  min="0"
                  :aria-label="`Lesson ${index + 1} sub-lessons`"
                />
                <div class="lesson-actions">
                  <button
                    class="lesson-delete"
                    type="button"
                    :aria-label="`Delete lesson ${index + 1}`"
                    @click="removeLesson(lesson.id)"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M16.5 4.47801V4.70501C17.799 4.8238 19.0927 4.9946 20.378 5.21701C20.4751 5.23382 20.5678 5.26958 20.6511 5.32225C20.7343 5.37491 20.8063 5.44346 20.8631 5.52397C20.9198 5.60448 20.9601 5.69537 20.9817 5.79146C21.0033 5.88755 21.0058 5.98696 20.989 6.08401C20.9722 6.18106 20.9364 6.27384 20.8838 6.35707C20.8311 6.4403 20.7626 6.51233 20.682 6.56907C20.6015 6.62581 20.5106 6.66613 20.4146 6.68774C20.3185 6.70935 20.2191 6.71182 20.122 6.69501L19.913 6.66001L18.908 19.73C18.8501 20.4836 18.5098 21.1875 17.9553 21.7011C17.4008 22.2146 16.6728 22.5 15.917 22.5H8.08401C7.3282 22.5 6.60026 22.2146 6.04573 21.7011C5.4912 21.1875 5.15095 20.4836 5.09301 19.73L4.08701 6.66001L3.87801 6.69501C3.78096 6.71182 3.68155 6.70935 3.58546 6.68774C3.48937 6.66613 3.39847 6.62581 3.31796 6.56907C3.15537 6.45449 3.04495 6.28 3.01101 6.08401C2.97706 5.88801 3.02236 5.68656 3.13694 5.52397C3.25153 5.36137 3.42601 5.25096 3.62201 5.21701C4.90727 4.99433 6.20099 4.82353 7.50001 4.70501V4.47801C7.50001 2.91401 8.71301 1.57801 10.316 1.52701C11.4387 1.49108 12.5623 1.49108 13.685 1.52701C15.288 1.57801 16.5 2.91401 16.5 4.47801ZM10.364 3.02601C11.4547 2.99113 12.5463 2.99113 13.637 3.02601C14.39 3.05001 15 3.68401 15 4.47801V4.59101C13.0018 4.46966 10.9982 4.46966 9.00001 4.59101V4.47801C9.00001 3.68401 9.60901 3.05001 10.364 3.02601ZM10.009 8.97101C10.0052 8.87252 9.98203 8.77574 9.94082 8.6862C9.89961 8.59667 9.84117 8.51612 9.76883 8.44917C9.69649 8.38222 9.61168 8.33017 9.51923 8.296C9.42678 8.26183 9.3285 8.2462 9.23001 8.25001C9.13152 8.25382 9.03474 8.27699 8.9452 8.3182C8.85567 8.35941 8.77512 8.41785 8.70817 8.49019C8.64122 8.56252 8.58917 8.64734 8.555 8.73979C8.52083 8.83224 8.5052 8.93052 8.50901 9.02901L8.85601 18.029C8.8637 18.2278 8.95004 18.4154 9.09604 18.5505C9.16833 18.6174 9.25309 18.6694 9.34548 18.7036C9.43787 18.7377 9.53608 18.7533 9.63451 18.7495C9.73293 18.7457 9.82964 18.7225 9.91912 18.6814C10.0086 18.6402 10.0891 18.5818 10.156 18.5095C10.2229 18.4372 10.2749 18.3524 10.3091 18.26C10.3432 18.1676 10.3588 18.0694 10.355 17.971L10.009 8.97101ZM15.489 9.02901C15.4963 8.92863 15.4834 8.82779 15.4509 8.73252C15.4185 8.63725 15.3672 8.54948 15.3001 8.47445C15.233 8.39942 15.1515 8.33866 15.0604 8.2958C14.9694 8.25293 14.8706 8.22883 14.77 8.22494C14.6694 8.22104 14.5691 8.23743 14.475 8.27313C14.3809 8.30883 14.2949 8.3631 14.2222 8.43272C14.1496 8.50234 14.0916 8.58587 14.0519 8.67835C14.0122 8.77083 13.9915 8.87036 13.991 8.97101L13.644 17.971C13.6363 18.1699 13.708 18.3637 13.8432 18.5098C13.9784 18.6559 14.1661 18.7423 14.365 18.75C14.5639 18.7577 14.7577 18.6861 14.9038 18.5508C15.0499 18.4156 15.1363 18.2279 15.144 18.029L15.489 9.02901Z"
                        fill="#8dade0"
                      />
                    </svg>
                  </button>
                  <button
                    class="lesson-edit"
                    type="button"
                    :aria-label="`Edit lesson ${index + 1}`"
                    @click="focusLessonName"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path
                        d="M21.7313 2.26899C21.239 1.77681 20.5714 1.50031 19.8753 1.50031C19.1791 1.50031 18.5115 1.77681 18.0193 2.26899L16.8623 3.42599L20.5743 7.13799L21.7313 5.98099C22.2234 5.48872 22.4999 4.82111 22.4999 4.12499C22.4999 3.42888 22.2234 2.76127 21.7313 2.26899ZM19.5133 8.199L15.8013 4.48699L7.40125 12.887C6.78411 13.5038 6.33043 14.2648 6.08125 15.101L5.28125 17.786C5.24263 17.9156 5.23975 18.0532 5.27292 18.1842C5.30608 18.3153 5.37407 18.435 5.46967 18.5306C5.56527 18.6262 5.68494 18.6942 5.81601 18.7273C5.94709 18.7605 6.08469 18.7576 6.21425 18.719L8.89925 17.919C9.73548 17.6698 10.4964 17.2161 11.1133 16.599L19.5133 8.199Z"
                        fill="#8dade0"
                      />
                      <path
                        d="M5.25 5.25C4.45435 5.25 3.69129 5.56607 3.12868 6.12868C2.56607 6.69129 2.25 7.45435 2.25 8.25V18.75C2.25 19.5456 2.56607 20.3087 3.12868 20.8713C3.69129 21.4339 4.45435 21.75 5.25 21.75H15.75C16.5456 21.75 17.3087 21.4339 17.8713 20.8713C18.4339 20.3087 18.75 19.5456 18.75 18.75V13.5C18.75 13.3011 18.671 13.1103 18.5303 12.9697C18.3897 12.829 18.1989 12.75 18 12.75C17.8011 12.75 17.6103 12.829 17.4697 12.9697C17.329 13.1103 17.25 13.3011 17.25 13.5V18.75C17.25 19.1478 17.092 19.5294 16.8107 19.8107C16.5294 20.092 16.1478 20.25 15.75 20.25H5.25C4.85218 20.25 4.47064 20.092 4.18934 19.8107C3.90804 19.5294 3.75 19.1478 3.75 18.75V8.25C3.75 7.85218 3.90804 7.47064 4.18934 7.18934C4.47064 6.90804 4.85218 6.75 5.25 6.75H10.5C10.6989 6.75 10.8897 6.67098 11.0303 6.53033C11.171 6.38968 11.25 6.19891 11.25 6C11.25 5.80109 11.171 5.61032 11.0303 5.46967C10.8897 5.32902 10.6989 5.25 10.5 5.25H5.25Z"
                        fill="#8dade0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p v-if="lessons.length === 0" class="empty-lessons">No lessons added yet.</p>
            </div>
          </section>
        </main>
      </form>
    </section>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
:global(body) {
  margin: 0;
  min-width: 320px;
  background: #f6f7fc;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
:global(button),
:global(input),
:global(textarea) {
  font: inherit;
}
.admin-layout {
  display: flex;
  min-height: 100vh;
  color: #000;
}
.sidebar {
  position: sticky;
  z-index: 3;
  top: 0;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 100vh;
  flex: 0 0 240px;
  width: 240px;
  gap: 40px;
  border-right: 1px solid #d6d9e4;
  background: #fff;
}
.sidebar-header {
  display: flex;
  height: 131px;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  padding: 40px 24px 24px;
}
.brand {
  display: flex;
  width: 174px;
  height: 19px;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
.brand img {
  display: block;
  width: 174px;
  height: 19px;
}
.sidebar-header p {
  margin: 0;
  color: #646d89;
}
.sidebar-nav {
  display: flex;
  width: 240px;
  height: 540px;
  flex-direction: column;
  align-items: flex-start;
}
.nav-item {
  display: flex;
  width: 240px;
  height: 56px;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  color: #424c6b;
  font-weight: 500;
  text-decoration: none;
}
.nav-item.active {
  background: #f1f2f6;
}
.nav-item:hover {
  background: #f6f7fc;
}
.nav-item svg {
  width: 24px;
  height: 24px;
  flex: none;
  fill: none;
  stroke: #8dade0;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}
.nav-item.logout {
  margin-top: auto;
  font-weight: 700;
}
.workspace {
  min-width: 0;
  flex: 1;
}
.topbar {
  position: sticky;
  z-index: 2;
  top: 0;
  display: flex;
  height: 92px;
  align-items: center;
  padding: 16px 40px;
  border-bottom: 1px solid #d6d9e4;
  background: #fff;
}
h1 {
  flex: 1;
  margin: 0;
  color: #2a2e3f;
  font-size: 24px;
  font-weight: 500;
}
.back-button {
  display: inline-grid;
  width: 32px;
  height: 40px;
  margin-right: 8px;
  place-items: center;
  color: #9aa1b9;
}
.back-button svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}
h1 span {
  margin-right: 8px;
  color: #9aa1b9;
}
.topbar-actions {
  display: flex;
  gap: 16px;
}
.cancel-button,
.save-button,
.add-lesson-button {
  display: inline-flex;
  height: 60px;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  border-radius: 12px;
  box-shadow: 4px 4px 24px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.cancel-button {
  border: 1px solid #f47e20;
  background: #fff;
  color: #f47e20;
}
.save-button,
.add-lesson-button {
  border: 1px solid #2f5fac;
  background: #2f5fac;
  color: #fff;
}
.content {
  min-height: calc(100vh - 92px);
  padding: 40px;
}
.package-card {
  display: flex;
  width: min(1120px, 100%);
  flex-direction: column;
  gap: 40px;
  margin: 0 auto;
  padding: 40px 100px 60px;
  border: 1px solid #e6e7eb;
  border-radius: 16px;
  background: #fff;
}
.field {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}
.field > span,
.upload-field > span:first-child {
  font-size: 16px;
  line-height: 24px;
}
.field input,
.field textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d6d9e4;
  border-radius: 8px;
  outline: 0;
  color: #2a2e3f;
  resize: vertical;
}
.field input {
  height: 48px;
}
.field input:focus,
.field textarea:focus {
  border-color: #2f5fac;
  box-shadow: 0 0 0 3px rgba(47, 95, 172, 0.12);
}
.field.has-error input,
.field.has-error textarea,
fieldset.has-error .discount-input:not(:disabled) {
  padding-right: 40px;
  border-color: #9b2fac !important;
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.3996 7.99961C14.3996 11.5342 11.5342 14.3996 7.99961 14.3996C4.46499 14.3996 1.59961 11.5342 1.59961 7.99961C1.59961 4.46499 4.46499 1.59961 7.99961 1.59961C11.5342 1.59961 14.3996 4.46499 14.3996 7.99961ZM8.79961 11.1996C8.79961 11.6414 8.44144 11.9996 7.99961 11.9996C7.55778 11.9996 7.19961 11.6414 7.19961 11.1996C7.19961 10.7578 7.55778 10.3996 7.99961 10.3996C8.44144 10.3996 8.79961 10.7578 8.79961 11.1996ZM7.99961 3.99961C7.55778 3.99961 7.19961 4.35778 7.19961 4.79961V7.99961C7.19961 8.44144 7.55778 8.79961 7.99961 8.79961C8.44144 8.79961 8.79961 8.44144 8.79961 7.99961V4.79961C8.79961 4.35778 8.44144 3.99961 7.99961 3.99961Z' fill='%239B2FAC'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  box-shadow: 0 0 0 1px rgba(155, 47, 172, 0.08);
}
.field.has-error textarea {
  background-position: right 12px top 12px;
}
.field.has-error input:focus,
.field.has-error textarea:focus {
  border-color: #9b2fac;
  box-shadow: 0 0 0 3px rgba(155, 47, 172, 0.12);
}
.field.has-invalid-value input,
.field.has-invalid-value input:focus {
  border-color: #f47e20 !important;
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.3996 7.99961C14.3996 11.5342 11.5342 14.3996 7.99961 14.3996C4.46499 14.3996 1.59961 11.5342 1.59961 7.99961C1.59961 4.46499 4.46499 1.59961 7.99961 1.59961C11.5342 1.59961 14.3996 4.46499 14.3996 7.99961ZM8.79961 11.1996C8.79961 11.6414 8.44144 11.9996 7.99961 11.9996C7.55778 11.9996 7.19961 11.6414 7.19961 11.1996C7.19961 10.7578 7.55778 10.3996 7.99961 10.3996C8.44144 10.3996 8.79961 10.7578 8.79961 11.1996ZM7.99961 3.99961C7.55778 3.99961 7.19961 4.35778 7.19961 4.79961V7.99961C7.19961 8.44144 7.55778 8.79961 7.99961 8.79961C8.44144 8.79961 8.79961 8.44144 8.79961 7.99961V4.79961C8.79961 4.35778 8.44144 3.99961 7.99961 3.99961Z' fill='%23F47E20'/%3E%3C/svg%3E");
  box-shadow: 0 0 0 1px rgba(244, 126, 32, 0.08);
}
.field input::placeholder,
.field textarea::placeholder {
  color: #9aa1b9;
}
.two-column {
  display: flex;
  gap: 40px;
}
.promo-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.check-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #2a2e3f;
  font-weight: 500;
}
.check-row input {
  width: 24px;
  height: 24px;
  accent-color: #2f5fac;
}
.promo-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 32px;
  border-radius: 8px;
  background: #f4f6fd;
}
fieldset {
  padding: 0;
  border: 0;
}
legend {
  margin-bottom: 8px;
}
.radio-row {
  display: flex;
  gap: 40px;
}
.radio-row label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #424c6b;
  font-weight: 500;
}
.radio-row input {
  width: 22px;
  height: 22px;
  accent-color: #2f5fac;
}
.discount-row {
  gap: 28px;
}
.discount-row label {
  flex-wrap: wrap;
}
.discount-input {
  width: 72px !important;
  height: 40px !important;
  padding: 8px 10px;
  border: 1px solid #d6d9e4;
  border-radius: 6px;
  background-color: #ffffff;
  color: #2a2e3f;
}
.discount-input:focus {
  border-color: #2f5fac;
  outline: 0;
  box-shadow: 0 0 0 3px rgba(47, 95, 172, 0.12);
}
fieldset.has-error .discount-input:not(:disabled) {
  border-color: #9b2fac !important;
}
fieldset.has-error .discount-input:not(:disabled):focus {
  box-shadow: 0 0 0 3px rgba(155, 47, 172, 0.12);
}
fieldset.has-invalid-value .discount-input:not(:disabled),
fieldset.has-invalid-value .discount-input:not(:disabled):focus {
  border-color: #f47e20 !important;
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.3996 7.99961C14.3996 11.5342 11.5342 14.3996 7.99961 14.3996C4.46499 14.3996 1.59961 11.5342 1.59961 7.99961C1.59961 4.46499 4.46499 1.59961 7.99961 1.59961C11.5342 1.59961 14.3996 4.46499 14.3996 7.99961ZM8.79961 11.1996C8.79961 11.6414 8.44144 11.9996 7.99961 11.9996C7.55778 11.9996 7.19961 11.6414 7.19961 11.1996C7.19961 10.7578 7.55778 10.3996 7.99961 10.3996C8.44144 10.3996 8.79961 10.7578 8.79961 11.1996ZM7.99961 3.99961C7.55778 3.99961 7.19961 4.35778 7.19961 4.79961V7.99961C7.19961 8.44144 7.55778 8.79961 7.99961 8.79961C8.44144 8.79961 8.79961 8.44144 8.79961 7.99961V4.79961C8.79961 4.35778 8.44144 3.99961 7.99961 3.99961Z' fill='%23F47E20'/%3E%3C/svg%3E");
  box-shadow: 0 0 0 1px rgba(244, 126, 32, 0.08);
}
fieldset .field-error {
  margin-top: 8px;
}
.upload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px 76px;
}
.upload-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.upload-field small {
  min-height: 24px;
  color: #9aa1b9;
  font-size: 14px;
}
.upload-box {
  position: relative;
  display: flex;
  width: 240px;
  height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  background: #f6f7fc;
  color: #5483d0;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  overflow-wrap: anywhere;
}
.upload-box svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}
.upload-box input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.upload-field.has-error .upload-box {
  border-color: #9b2fac !important;
  box-shadow: 0 0 0 1px rgba(155, 47, 172, 0.08);
}
.compact-upload .upload-box {
  width: 160px;
  height: 160px;
}
.lessons-section {
  width: min(1120px, 100%);
  margin: 76px auto 0;
}
.section-heading {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
}
.section-heading h2 {
  flex: 1;
  margin: 0;
  color: #2a2e3f;
  font-size: 24px;
  font-weight: 500;
}
.add-lesson-button {
  height: 60px;
}
.lesson-table {
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
}
.lesson-head,
.lesson-row {
  display: grid;
  grid-template-columns: 56px minmax(260px, 1fr) 180px 120px;
  align-items: center;
}
.lesson-head {
  min-height: 41px;
  background: #e4e6ed;
  color: #424c6b;
  font-size: 14px;
}
.lesson-head span,
.lesson-row > span {
  padding: 10px 16px;
}
.lesson-row {
  min-height: 88px;
  border-bottom: 1px solid #f1f2f6;
}
.lesson-row input {
  height: 44px;
  margin: 10px 16px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
}
.lesson-row input:focus {
  border-color: #8dade0;
  outline: 0;
}
.lesson-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
}
.lesson-row button {
  width: 40px;
  height: 40px;
  margin-left: 16px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8dade0;
  cursor: pointer;
}
.lesson-actions button {
  width: 32px;
  height: 32px;
  margin: 0;
}
.lesson-row button:hover {
  background: #f1f2f6;
  color: #b42318;
}
.lesson-actions .lesson-edit:hover {
  color: #2f5fac;
}
.lesson-row svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}
.empty-lessons {
  padding: 40px;
  color: #646d89;
  text-align: center;
}

/* The create screen follows the visual rhythm of the reference UI without
   changing the shared form behaviour or the existing edit screen. */
.create-mode .topbar {
  min-height: 88px;
  height: auto;
  padding: 20px 40px;
}

.create-mode .topbar-actions {
  gap: 12px;
}

.create-mode .cancel-button,
.create-mode .save-button {
  height: 48px;
  min-width: 112px;
  padding: 0 24px;
  border-radius: 10px;
}

.create-mode .content {
  padding: 32px 40px 56px;
}

.create-mode .package-card {
  width: min(1024px, 100%);
  gap: 24px;
  padding: 32px;
  border-color: #d6d9e4;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(42, 46, 63, 0.06);
}

.create-mode .field,
.create-mode .upload-field {
  gap: 8px;
}

.create-mode .field > span,
.create-mode .upload-field > span:first-child,
.create-mode legend {
  color: #2a2e3f;
  font-weight: 500;
}

.create-mode .field input,
.create-mode .field textarea {
  border-color: #c8ccdb;
  background: #ffffff;
}

.create-mode .field textarea {
  min-height: 112px;
}

.create-mode .promo-section {
  gap: 12px;
}

.create-mode .promo-panel {
  gap: 16px;
  padding: 20px 28px 24px;
  border-radius: 8px;
  background: #f4f6fd;
}

.create-mode .promo-panel .field {
  gap: 4px;
}

.create-mode .promo-panel .field > span,
.create-mode .promo-panel legend {
  font-size: 14px;
  line-height: 21px;
}

.create-mode .promo-panel .field input {
  height: 44px;
  border-radius: 6px;
}

.create-mode .promo-panel legend {
  margin-bottom: 6px;
}

.create-mode .promo-panel .discount-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
}

.create-mode .promo-panel .discount-row label {
  display: grid;
  grid-template-columns: 20px max-content minmax(72px, 136px);
  flex-wrap: nowrap;
  gap: 10px;
}

.create-mode .promo-panel .radio-row > label > input[type='radio'] {
  width: 20px;
  height: 20px;
}

.create-mode .promo-panel .discount-input {
  width: 100% !important;
  height: 40px !important;
}

.create-mode .upload-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.create-mode .upload-field small {
  min-height: 0;
  color: #646d89;
}

.create-mode .upload-box {
  width: 176px;
  height: 176px;
  border: 1px solid #d6d9e4;
  background: #f6f7fc;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.create-mode .upload-box:hover,
.create-mode .upload-box:focus-within {
  border-color: #8dade0;
  background: #edf3fc;
  box-shadow: 0 0 0 3px rgba(47, 95, 172, 0.1);
}

.create-mode .compact-upload .upload-box {
  width: 144px;
  height: 144px;
}

.create-mode .attach-file-field {
  align-items: flex-start;
}

.create-mode .attach-file-box {
  gap: 10px;
  border: 0;
  border-radius: 6px;
  background: #f4f6fd;
  color: #5483d0;
  font-size: 14px;
}

.create-mode .attach-file-box svg {
  width: 24px;
  height: 24px;
  stroke-width: 1.5;
}

.create-mode .lessons-section {
  width: min(1024px, 100%);
  margin-top: 32px;
}

.create-mode .section-heading {
  margin-bottom: 24px;
}

.create-mode .add-lesson-button {
  height: 48px;
  padding: 0 24px;
  border-radius: 10px;
}

.create-mode .lesson-table {
  border: 1px solid #e4e6ed;
  box-shadow: 0 8px 24px rgba(42, 46, 63, 0.04);
}

.create-mode .lesson-head {
  background: #e9ebf1;
}

@media (max-width: 900px) {
  .sidebar {
    position: static;
    height: auto;
    flex: none;
    gap: 0;
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid #d6d9e4;
  }
  .admin-layout {
    flex-direction: column;
  }
  .sidebar-header {
    height: auto;
    align-items: flex-start;
    gap: 8px;
    padding: 24px;
  }
  .sidebar-nav {
    width: 100%;
    height: auto;
    flex-direction: row;
    overflow-x: auto;
  }
  .nav-item {
    min-width: max-content;
  }
  .nav-item.logout {
    margin-top: 0;
  }
  .workspace {
    width: 100%;
    margin-left: 0;
  }
  .package-card {
    padding: 40px;
  }
  .create-mode .package-card {
    padding: 32px;
  }
}
@media (max-width: 700px) {
  .topbar {
    height: auto;
    flex-wrap: wrap;
    gap: 16px;
    padding: 20px;
  }
  .topbar-actions {
    width: 100%;
  }
  .cancel-button,
  .save-button {
    height: 48px;
    flex: 1;
  }
  .content {
    padding: 24px 20px;
  }
  .package-card {
    gap: 28px;
    padding: 28px 20px;
  }
  .create-mode .content {
    padding: 24px 20px 40px;
  }
  .create-mode .package-card {
    gap: 24px;
    padding: 24px 20px;
  }
  .create-mode .cancel-button,
  .create-mode .save-button {
    min-width: 0;
  }
  .two-column,
  .radio-row {
    flex-direction: column;
    gap: 20px;
  }
  .create-mode .promo-panel {
    padding: 20px;
  }
  .create-mode .promo-panel .discount-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .upload-grid {
    grid-template-columns: 1fr;
  }
  .lesson-table {
    overflow-x: auto;
  }
  .lesson-head,
  .lesson-row {
    min-width: 720px;
  }
}
</style>
