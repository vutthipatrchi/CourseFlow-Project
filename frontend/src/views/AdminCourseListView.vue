<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import deleteIcon from '@/assets/admin/delete.svg'
import editIcon from '@/assets/admin/edit.svg'
import serviceDesignThumbnail from '../assets/admin/courses/service-design.jpg'
import softwareDeveloperThumbnail from '../assets/admin/courses/software-developer.jpg'
import uxUiDesignThumbnail from '../assets/admin/courses/ux-ui-design.jpg'
import {
  courses,
  coursesError,
  coursesLoading,
  loadCourses,
  removeCourse,
  type Course,
} from '../admin/courseStore'

const search = ref('')
const route = useRoute()
const coursePendingDeletion = ref<Course | null>(null)
const deleting = ref(false)
const courseThumbnails = [
  serviceDesignThumbnail,
  softwareDeveloperThumbnail,
  uxUiDesignThumbnail,
]
const feedback = ref(
  typeof route.query.created === 'string'
    ? `${route.query.created} was created.`
    : typeof route.query.updated === 'string'
      ? `${route.query.updated} was updated.`
      : '',
)

onMounted(() => {
  void loadCourses().catch(() => undefined)
})

const filteredCourses = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return courses.value

  return courses.value.filter((course) => {
    const name = course.name.toLocaleLowerCase()
    const category = (course.category ?? '').toLocaleLowerCase()
    return name.includes(query) || category.includes(query)
  })
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function formatDateTime(value: string) {
  if (!value || /^\d{2}\/\d{2}\/\d{4}/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(',', '')
}

function requestDeletion(course: Course) {
  feedback.value = ''
  coursePendingDeletion.value = course
}

function cancelDeletion() {
  if (deleting.value) return
  coursePendingDeletion.value = null
}

async function deleteCourse() {
  const course = coursePendingDeletion.value
  if (!course || deleting.value) return

  deleting.value = true
  try {
    await removeCourse(course.id)
    feedback.value = `${course.name} was deleted.`
    coursePendingDeletion.value = null
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Unable to delete course.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <AdminLayout title="Course">
    <template #actions>
      <label class="search-box">
        <span class="sr-only">Search courses</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
        <input v-model="search" type="search" placeholder="Search..." />
      </label>
      <RouterLink class="add-button" to="/admin/courses/new">+ Add Course</RouterLink>
    </template>

    <p v-if="feedback" class="action-feedback" role="status">{{ feedback }}</p>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="number-column" scope="col"><span class="sr-only">Order</span></th>
            <th class="image-column" scope="col">Image</th>
            <th class="name-column" scope="col">Course name</th>
            <th class="lesson-column" scope="col">Lesson</th>
            <th class="price-column" scope="col">Price</th>
            <th class="created-date-column" scope="col">Created date</th>
            <th class="updated-date-column" scope="col">Updated date</th>
            <th class="action-column" scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(course, index) in filteredCourses" :key="course.id">
            <td class="number-column">{{ index + 1 }}</td>
            <td class="image-column">
              <div class="course-image">
                <img
                  :src="courseThumbnails[index % courseThumbnails.length]"
                  :alt="`${course.name} thumbnail`"
                />
              </div>
            </td>
            <td class="name-column">{{ course.name }}</td>
            <td class="lesson-column">{{ course.lessons }} Lessons</td>
            <td class="price-column">{{ formatPrice(course.price) }}</td>
            <td class="created-date-column">{{ formatDateTime(course.createdAt) }}</td>
            <td class="updated-date-column">{{ formatDateTime(course.updatedAt) }}</td>
            <td class="action-column">
              <button
                class="delete-action"
                type="button"
                :aria-label="`Delete ${course.name}`"
                @click="requestDeletion(course)"
              >
                <img :src="deleteIcon" alt="" width="24" height="24" />
              </button>
              <RouterLink
                class="edit-action"
                :to="{ name: 'admin-course-edit', params: { id: course.id } }"
                :aria-label="`Edit ${course.name}`"
              >
                <img :src="editIcon" alt="" width="24" height="24" />
              </RouterLink>
            </td>
          </tr>
          <tr v-if="coursesLoading && courses.length === 0">
            <td class="empty-state" colspan="8">Loading courses...</td>
          </tr>
          <tr v-else-if="coursesError && courses.length === 0">
            <td class="empty-state error-state" colspan="8">
              Unable to load courses: {{ coursesError }}
            </td>
          </tr>
          <tr v-else-if="filteredCourses.length === 0">
            <td class="empty-state" colspan="8">
              {{ search.trim() ? `No courses match “${search}”.` : 'No courses found.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="coursePendingDeletion"
      class="modal-backdrop"
      @click.self="cancelDeletion"
    >
      <section
        class="modal-card confirmation-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-course-title"
      >
        <div class="modal-top">
          <h2 id="delete-course-title">Confirmation</h2>
          <button
            class="modal-close"
            type="button"
            aria-label="Close confirmation"
            :disabled="deleting"
            @click="cancelDeletion"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        </div>
        <div class="modal-detail">
          <p>
            Are you sure you want to delete this course?
            <span class="sr-only">{{ coursePendingDeletion.name }}</span>
          </p>
          <div class="modal-actions">
            <button
              class="secondary-button"
              type="button"
              :disabled="deleting"
              @click="cancelDeletion"
            >
              Cancel
            </button>
            <button
              class="primary-button danger-button"
              type="button"
              :disabled="deleting"
              @click="deleteCourse"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<style scoped>
.search-box {
  display: flex;
  width: 320px;
  height: 48px;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid #ccd0d7;
  border-radius: 8px;
  background: #ffffff;
}

.search-box:focus-within {
  border-color: #2f5fac;
  box-shadow: 0 0 0 3px rgba(47, 95, 172, 0.12);
}

.search-box svg {
  width: 24px;
  height: 24px;
  flex: none;
  fill: none;
  stroke: #646d89;
  stroke-linecap: round;
  stroke-width: 1.5;
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: #2a2e3f;
  font-size: 16px;
}

.search-box input::placeholder {
  color: #9aa1b9;
}

.add-button {
  display: inline-flex;
  width: 172px;
  height: 60px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  background: #2f5fac;
  box-shadow: 4px 4px 24px rgba(0, 0, 0, 0.08);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.add-button:hover {
  background: #254f93;
}

.action-feedback {
  margin: 0 0 16px;
  padding: 12px 16px;
  border: 1px solid #b8dfc7;
  border-radius: 8px;
  background: #edf9f1;
  color: #287c4a;
}

.table-card {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
}

table {
  width: 100%;
  min-width: 1120px;
  table-layout: fixed;
  border-collapse: collapse;
  background: #ffffff;
}

th {
  height: 41px;
  padding: 10px 16px;
  background: #e4e6ed;
  color: #424c6b;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  text-align: left;
}

td {
  height: 88px;
  padding: 16px;
  border-bottom: 1px solid #f1f2f6;
  font-size: 16px;
  line-height: 24px;
  white-space: nowrap;
}

.number-column {
  width: 48px;
  text-align: center;
}

th.number-column {
  padding: 10px 24px;
}

td.number-column {
  padding-inline: 16px;
}

.image-column {
  width: 96px;
}

.name-column {
  width: 268px;
  white-space: normal;
}

.lesson-column,
.price-column {
  width: 105px;
}

.created-date-column {
  width: 188px;
}

.updated-date-column {
  width: 190px;
}

.action-column {
  width: 120px;
  text-align: center;
}

th.action-column {
  padding: 10px 24px;
}

td.action-column {
  padding: 32px 27px;
  font-size: 0;
  text-align: left;
}

.course-image {
  width: 64px;
  height: 47px;
  overflow: hidden;
  background: #f1f2f6;
}

.course-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-action,
.edit-action {
  display: inline-grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  vertical-align: middle;
}

.delete-action {
  margin-right: 17px;
}

.delete-action:hover,
.edit-action:hover {
  background: #f1f2f6;
}

.delete-action svg,
.edit-action svg {
  width: 24px;
  height: 24px;
}

.delete-action img,
.edit-action img {
  display: block;
  width: 24px;
  height: 24px;
}

.empty-state {
  height: 180px;
  color: #646d89;
  text-align: center;
}

.error-state {
  color: #c81e1e;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.modal-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgba(25, 28, 119, 0.28);
}

.modal-card {
  display: flex;
  width: min(100%, 528px);
  flex-direction: column;
  align-items: center;
  padding: 0;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 2px 2px 12px rgba(64, 50, 133, 0.12);
}

.modal-top {
  display: flex;
  width: 100%;
  height: 56px;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 0;
}

.modal-top h2 {
  margin: 0;
  color: #2a2e3f;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  letter-spacing: -0.02em;
}

.modal-close {
  display: inline-grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: #9aa1b9;
  cursor: pointer;
}

.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.modal-close svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.5;
}

.modal-detail {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
}

.modal-detail p {
  margin: 0;
  color: #646d89;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
}

.modal-actions {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.secondary-button,
.primary-button {
  display: inline-flex;
  height: 60px;
  align-items: center;
  justify-content: center;
  padding: 18px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  cursor: pointer;
}

.secondary-button {
  border: 1px solid #f47e7e;
  background: #ffffff;
  color: #f47e7e;
}

.secondary-button:hover:not(:disabled) {
  background: #fff5f5;
}

.primary-button {
  border: 0;
  background: #f47e7e;
  box-shadow: 4px 4px 24px rgba(0, 0, 0, 0.08);
  color: #ffffff;
}

.primary-button:hover:not(:disabled) {
  background: #e26666;
}

.secondary-button:disabled,
.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 1100px) {
  .search-box {
    width: min(100%, 320px);
  }
}
</style>
