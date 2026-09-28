import type { Course } from '@/types/course'
import serviceDesignImage from '@/assets/admin/courses/service-design.jpg'
import softwareDeveloperImage from '@/assets/admin/courses/software-developer.jpg'
import uxUiDesignImage from '@/assets/admin/courses/ux-ui-design.jpg'

const courseTemplates = [
  {
    title: 'Service Design Essentials',
    description: 'Learn the fundamentals of service design and apply them to real businesses.',
    imageUrl: serviceDesignImage,
  },
  {
    title: 'Software Developer',
    description: 'Build a solid foundation in programming and modern software development.',
    imageUrl: softwareDeveloperImage,
  },
  {
    title: 'UX/UI Design Beginner',
    description: 'Get started designing intuitive, user-friendly digital products from scratch.',
    imageUrl: uxUiDesignImage,
  },
  {
    title: 'UX/UI Design Beginner',
    description: 'Get started designing intuitive, user-friendly digital products from scratch.',
    imageUrl: uxUiDesignImage,
  },
  {
    title: 'Service Design Essentials',
    description: 'Learn the fundamentals of service design and apply them to real businesses.',
    imageUrl: serviceDesignImage,
  },
  {
    title: 'Software Developer',
    description: 'Build a solid foundation in programming and modern software development.',
    imageUrl: softwareDeveloperImage,
  },
]

export const courses: Course[] = Array.from({ length: 12 }, (_, index) => {
  const template = courseTemplates[index % courseTemplates.length]!
  return {
    id: `course-${index + 1}`,
    category: 'Course',
    title: template.title,
    description: template.description,
    longDescription:
      'บทเรียนจำลองสำหรับฝึกพื้นฐานด้วยตนเอง แต่ละบทมีคำอธิบาย ตัวอย่าง และแบบฝึกหัดพร้อมแนวคำตอบ เรียนตามลำดับและลองทำโจทย์ก่อนเปิดคำตอบ เนื้อหานี้เป็นตัวอย่างสำหรับทดลองระบบ ไม่ใช่หลักสูตรฉบับสมบูรณ์จากผู้สอน',
    imageUrl: template.imageUrl,
    lessonCount: 6,
    hourCount: 6,
    price: 3559,
    modules: [],
  }
})
