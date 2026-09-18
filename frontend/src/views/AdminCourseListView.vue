<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import courseFlowLogo from '../assets/admin/courseflow-sidebar-logo.svg'
import serviceDesignThumbnail from '../assets/admin/courses/service-design.jpg'
import softwareDeveloperThumbnail from '../assets/admin/courses/software-developer.jpg'
import uxUiDesignThumbnail from '../assets/admin/courses/ux-ui-design.jpg'
import { clearUserRole } from '../auth/access'
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
  return courses.value.filter((course) => course.name.toLocaleLowerCase().includes(query))
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
  coursePendingDeletion.value = null
}

async function deleteCourse() {
  const course = coursePendingDeletion.value
  if (!course) return

  try {
    await removeCourse(course.id)
    feedback.value = `${course.name} was deleted.`
    coursePendingDeletion.value = null
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Unable to delete course.'
  }
}
</script>

<template>
  <div class="admin-layout">
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
      <header class="topbar">
        <h1>Course</h1>
        <div class="topbar-actions">
          <label class="search-box">
            <span class="sr-only">Search courses</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
            <input v-model="search" type="search" placeholder="Search..." />
          </label>
          <RouterLink class="add-button" to="/admin/courses/new">Add Course</RouterLink>
        </div>
      </header>

      <main class="content">
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
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M16.5 4.47801V4.70501C17.799 4.8238 19.0927 4.9946 20.378 5.21701C20.4751 5.23382 20.5678 5.26958 20.6511 5.32225C20.7343 5.37491 20.8063 5.44346 20.8631 5.52397C20.9198 5.60448 20.9601 5.69537 20.9817 5.79146C21.0033 5.88755 21.0058 5.98696 20.989 6.08401C20.9722 6.18106 20.9364 6.27384 20.8838 6.35707C20.8311 6.4403 20.7626 6.51233 20.682 6.56907C20.6015 6.62581 20.5106 6.66613 20.4146 6.68774C20.3185 6.70935 20.2191 6.71182 20.122 6.69501L19.913 6.66001L18.908 19.73C18.8501 20.4836 18.5098 21.1875 17.9553 21.7011C17.4008 22.2146 16.6728 22.5 15.917 22.5H8.08401C7.3282 22.5 6.60026 22.2146 6.04573 21.7011C5.4912 21.1875 5.15095 20.4836 5.09301 19.73L4.08701 6.66001L3.87801 6.69501C3.78096 6.71182 3.68155 6.70935 3.58546 6.68774C3.48937 6.66613 3.39847 6.62581 3.31796 6.56907C3.15537 6.45449 3.04495 6.28 3.01101 6.08401C2.97706 5.88801 3.02236 5.68656 3.13694 5.52397C3.25153 5.36137 3.42601 5.25096 3.62201 5.21701C4.90727 4.99433 6.20099 4.82353 7.50001 4.70501V4.47801C7.50001 2.91401 8.71301 1.57801 10.316 1.52701C11.4387 1.49108 12.5623 1.49108 13.685 1.52701C15.288 1.57801 16.5 2.91401 16.5 4.47801ZM10.364 3.02601C11.4547 2.99113 12.5463 2.99113 13.637 3.02601C14.39 3.05001 15 3.68401 15 4.47801V4.59101C13.0018 4.46966 10.9982 4.46966 9.00001 4.59101V4.47801C9.00001 3.68401 9.60901 3.05001 10.364 3.02601ZM10.009 8.97101C10.0052 8.87252 9.98203 8.77574 9.94082 8.6862C9.89961 8.59667 9.84117 8.51612 9.76883 8.44917C9.69649 8.38222 9.61168 8.33017 9.51923 8.296C9.42678 8.26183 9.3285 8.2462 9.23001 8.25001C9.13152 8.25382 9.03474 8.27699 8.9452 8.3182C8.85567 8.35941 8.77512 8.41785 8.70817 8.49019C8.64122 8.56252 8.58917 8.64734 8.555 8.73979C8.52083 8.83224 8.5052 8.93052 8.50901 9.02901L8.85601 18.029C8.8637 18.2278 8.95004 18.4154 9.09604 18.5505C9.16833 18.6174 9.25309 18.6694 9.34548 18.7036C9.43787 18.7377 9.53608 18.7533 9.63451 18.7495C9.73293 18.7457 9.82964 18.7225 9.91912 18.6814C10.0086 18.6402 10.0891 18.5818 10.156 18.5095C10.2229 18.4372 10.2749 18.3524 10.3091 18.26C10.3432 18.1676 10.3588 18.0694 10.355 17.971L10.009 8.97101ZM15.489 9.02901C15.4963 8.92863 15.4834 8.82779 15.4509 8.73252C15.4185 8.63725 15.3672 8.54948 15.3001 8.47445C15.233 8.39942 15.1515 8.33866 15.0604 8.2958C14.9694 8.25293 14.8706 8.22883 14.77 8.22494C14.6694 8.22104 14.5691 8.23743 14.475 8.27313C14.3809 8.30883 14.2949 8.3631 14.2222 8.43272C14.1496 8.50234 14.0916 8.58587 14.0519 8.67835C14.0122 8.77083 13.9915 8.87036 13.991 8.97101L13.644 17.971C13.6363 18.1699 13.708 18.3637 13.8432 18.5098C13.9784 18.6559 14.1661 18.7423 14.365 18.75C14.5639 18.7577 14.7577 18.6861 14.9038 18.5508C15.0499 18.4156 15.1363 18.2279 15.144 18.029L15.489 9.02901Z"
                        fill="#8dade0"
                      />
                    </svg>
                  </button>
                  <RouterLink
                    class="edit-action"
                    :to="{ name: 'admin-course-edit', params: { id: course.id } }"
                    :aria-label="`Edit ${course.name}`"
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
                <td class="empty-state" colspan="8">No courses match “{{ search }}”.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </section>

    <div v-if="coursePendingDeletion" class="modal-backdrop" @click.self="cancelDeletion">
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
            <button class="secondary-button" type="button" @click="cancelDeletion">
              Secondary
            </button>
            <button class="primary-button danger-button" type="button" @click="deleteCourse">
              Primary
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

:global(button),
:global(input) {
  font: inherit;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f6f7fc;
  color: #000000;
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
  background: #ffffff;
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
  font-size: 16px;
  line-height: 24px;
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
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
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
  gap: 16px;
  padding: 16px 40px;
  border-bottom: 1px solid #d6d9e4;
  background: #ffffff;
}

h1 {
  min-width: 140px;
  flex: 1;
  margin: 0;
  color: #2a2e3f;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  letter-spacing: -0.02em;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

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

.content {
  min-height: calc(100vh - 92px);
  padding: 48px 40px;
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

.action-column button,
.action-column a {
  display: inline-grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8dade0;
  cursor: pointer;
  text-decoration: none;
  vertical-align: middle;
}

.action-column button {
  margin-right: 17px;
}

.action-column button:hover,
.action-column a:hover {
  background: #f1f2f6;
  color: #2f5fac;
}

.action-column svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.empty-state {
  height: 180px;
  color: #646d89;
  text-align: center;
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
  height: 212px;
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
  padding: 8px 24px;
  border-bottom: 1px solid #e4e6ed;
}

.modal-card h2 {
  min-width: 0;
  flex: 1;
  margin: 0;
  color: #000000;
  font-size: 20px;
  font-weight: 400;
  line-height: 30px;
}

.modal-close {
  display: grid;
  width: 41px;
  height: 40px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #c8ccdb;
  cursor: pointer;
}

.modal-close svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.modal-close:hover {
  color: #646d89;
}

.modal-detail {
  display: flex;
  width: 100%;
  height: 156px;
  flex: none;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  padding: 24px;
}

.confirmation-card p {
  width: 100%;
  height: 24px;
  margin: 0;
  color: #646d89;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.modal-actions {
  display: flex;
  width: 475px;
  height: 60px;
  align-items: flex-start;
  gap: 16px;
}

.modal-actions button {
  display: flex;
  height: 60px;
  align-items: center;
  justify-content: center;
  padding: 18px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
}

.secondary-button {
  width: 312px;
  border: 1px solid #f47e20;
  background: #ffffff;
  box-shadow: 4px 4px 24px rgba(0, 0, 0, 0.08);
  color: #f47e20;
}

.primary-button {
  width: 147px;
  border: 0;
  background: #2f5fac;
  box-shadow: 4px 4px 24px rgba(0, 0, 0, 0.08);
  color: #ffffff;
}

.secondary-button:hover {
  background: #fff8f2;
}

.primary-button:hover {
  background: #254f93;
}

@media (max-width: 580px) {
  .modal-card {
    height: auto;
  }

  .modal-detail {
    height: auto;
  }

  .modal-actions {
    width: 100%;
  }

  .secondary-button {
    min-width: 0;
    flex: 1;
  }

  .primary-button {
    width: 147px;
    flex: none;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
}

@media (max-width: 700px) {
  .topbar {
    height: auto;
    flex-wrap: wrap;
    padding: 20px;
  }

  .topbar-actions,
  .search-box {
    width: 100%;
  }

  .add-button {
    width: 150px;
    flex: none;
  }

  .content {
    padding: 28px 20px;
  }
}

@media (max-width: 480px) {
  .topbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .add-button {
    width: 100%;
  }
}
</style>
