<script setup lang="ts">
import { computed, ref } from 'vue'
import { clearUserRole } from '../auth/access'

type Course = {
  id: number
  name: string
  lessons: number
  price: number
  createdAt: string
  updatedAt: string
  accent: string
}

const search = ref('')

const courses: Course[] = [
  {
    id: 1,
    name: 'Service Design Essentials',
    lessons: 6,
    price: 3559,
    createdAt: '12/02/2022 10:30PM',
    updatedAt: '12/02/2022 10:30PM',
    accent: '#dce8fb',
  },
  {
    id: 2,
    name: 'Design Thinking Fundamentals',
    lessons: 8,
    price: 2990,
    createdAt: '18/03/2022 09:15AM',
    updatedAt: '22/03/2022 02:45PM',
    accent: '#fce4cf',
  },
  {
    id: 3,
    name: 'UX Research Methods',
    lessons: 7,
    price: 3190,
    createdAt: '07/05/2022 01:20PM',
    updatedAt: '10/05/2022 11:00AM',
    accent: '#d9f0e3',
  },
  {
    id: 4,
    name: 'Product Strategy',
    lessons: 9,
    price: 3990,
    createdAt: '21/06/2022 03:30PM',
    updatedAt: '25/06/2022 10:10AM',
    accent: '#ede0f3',
  },
  {
    id: 5,
    name: 'Digital Marketing Basics',
    lessons: 6,
    price: 2550,
    createdAt: '04/07/2022 08:45AM',
    updatedAt: '11/07/2022 04:00PM',
    accent: '#fff0bd',
  },
  {
    id: 6,
    name: 'Data Analytics Foundations',
    lessons: 10,
    price: 4590,
    createdAt: '16/08/2022 12:00PM',
    updatedAt: '20/08/2022 05:15PM',
    accent: '#d9ebef',
  },
  {
    id: 7,
    name: 'Leadership Essentials',
    lessons: 5,
    price: 2790,
    createdAt: '02/09/2022 10:30AM',
    updatedAt: '08/09/2022 01:25PM',
    accent: '#fde1e1',
  },
  {
    id: 8,
    name: 'Agile Project Management',
    lessons: 8,
    price: 3590,
    createdAt: '14/10/2022 09:00AM',
    updatedAt: '18/10/2022 03:40PM',
    accent: '#e2e4fa',
  },
]

const filteredCourses = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return courses
  return courses.filter((course) => course.name.toLocaleLowerCase().includes(query))
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <RouterLink class="brand" to="/">CourseFlow</RouterLink>
        <p>Admin Panel Control</p>
      </div>

      <nav class="sidebar-nav" aria-label="Admin navigation">
        <RouterLink class="nav-item active" to="/admin/courses">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 5.5h16v13H4zM8 9h8M8 13h6" />
          </svg>
          Courses
        </RouterLink>
        <a class="nav-item" href="#users">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3" />
            <path d="M6 20c0-4 2.7-6 6-6s6 2 6 6" />
          </svg>
          Users
        </a>
        <a class="nav-item" href="#coupons">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3.5 8.5 8.5 3.5h12v12l-5 5-12-12Z" />
            <circle cx="15.5" cy="8.5" r="1.5" />
          </svg>
          Coupons
        </a>
        <RouterLink class="nav-item logout" to="/" @click="clearUserRole">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
          </svg>
          Logout
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
          <button class="add-button" type="button">Add Course</button>
        </div>
      </header>

      <main class="content">
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th class="number-column" scope="col"><span class="sr-only">Order</span></th>
                <th class="image-column" scope="col">Image</th>
                <th class="name-column" scope="col">Course name</th>
                <th scope="col">Lesson</th>
                <th scope="col">Price</th>
                <th class="date-column" scope="col">Created date</th>
                <th class="date-column" scope="col">Updated date</th>
                <th class="action-column" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(course, index) in filteredCourses" :key="course.id">
                <td class="number-column">{{ index + 1 }}</td>
                <td class="image-column">
                  <div class="course-image" :style="{ backgroundColor: course.accent }">
                    <span>{{ course.name.charAt(0) }}</span>
                  </div>
                </td>
                <td class="name-column">{{ course.name }}</td>
                <td>{{ course.lessons }} Lessons</td>
                <td>{{ formatPrice(course.price) }}</td>
                <td class="date-column">{{ course.createdAt }}</td>
                <td class="date-column">{{ course.updatedAt }}</td>
                <td class="action-column">
                  <button type="button" :aria-label="`Delete ${course.name}`">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
                    </svg>
                  </button>
                  <button type="button" :aria-label="`Edit ${course.name}`">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m14.5 5.5 4 4M5 19l3.5-.7L19 7.8 16.2 5 5.7 15.5 5 19Z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredCourses.length === 0">
                <td class="empty-state" colspan="8">No courses match “{{ search }}”.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
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
  position: fixed;
  z-index: 3;
  top: 0;
  bottom: 0;
  left: 0;
  width: 240px;
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
  background: linear-gradient(109.54deg, #95beff 18.21%, #0040e6 95.27%);
  background-clip: text;
  color: transparent;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 19px;
  text-decoration: none;
}

.sidebar-header p {
  margin: 0;
  color: #646d89;
  font-size: 16px;
  line-height: 24px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
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
  font-weight: 700;
}

.workspace {
  width: calc(100% - 240px);
  min-width: 0;
  margin-left: 240px;
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
}

.add-button:hover {
  background: #254f93;
}

.content {
  min-height: calc(100vh - 92px);
  padding: 48px 40px;
}

.table-card {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
}

table {
  width: 100%;
  min-width: 1120px;
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
  padding-inline: 16px;
  text-align: center;
}

.image-column {
  width: 96px;
}

.name-column {
  width: 268px;
  white-space: normal;
}

.date-column {
  width: 188px;
}

.action-column {
  width: 120px;
  text-align: center;
}

.course-image {
  display: grid;
  width: 64px;
  height: 47px;
  place-items: center;
  overflow: hidden;
  border-radius: 4px;
  color: #2f5fac;
  font-size: 22px;
  font-weight: 800;
}

.course-image span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
}

.action-column button {
  width: 36px;
  height: 36px;
  padding: 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8dade0;
  cursor: pointer;
}

.action-column button:hover {
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
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item {
    min-width: max-content;
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
