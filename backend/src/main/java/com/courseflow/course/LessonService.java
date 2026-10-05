package com.courseflow.course;

import com.courseflow.common.web.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!standalone")
public class LessonService {

    private final LessonRepository lessonRepository;

    public LessonService(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    public List<LessonSummaryResponse> listByCourse(Long courseId) {
        ensureCourseExists(courseId);
        return lessonRepository.findSummariesByCourseId(courseId);
    }

    @Transactional
    public LessonDetailResponse create(Long courseId, CreateLessonRequest request) {
        if (!lessonRepository.lockCourse(courseId)) {
            throw new ResourceNotFoundException("Course " + courseId + " not found");
        }
        int position = lessonRepository.nextLessonPosition(courseId);
        Long lessonId = lessonRepository.insertLesson(courseId, request.name(), position);
        replaceSubLessons(lessonId, request.subLessons());
        return lessonRepository.findDetail(lessonId).orElseThrow();
    }

    public LessonDetailResponse get(Long lessonId) {
        return lessonRepository
                .findDetail(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson " + lessonId + " not found"));
    }

    @Transactional
    public LessonDetailResponse update(Long lessonId, UpdateLessonRequest request) {
        ensureLessonExists(lessonId);
        lessonRepository.updateLessonName(lessonId, request.name());
        replaceSubLessons(lessonId, request.subLessons());
        return lessonRepository.findDetail(lessonId).orElseThrow();
    }

    @Transactional
    public void delete(Long lessonId) {
        ensureLessonExists(lessonId);
        lessonRepository.deleteLesson(lessonId);
    }

    private void replaceSubLessons(Long lessonId, List<SubLessonWriteRequest> subLessons) {
        var requestedIds = new java.util.HashSet<Long>();
        for (SubLessonWriteRequest item : subLessons) {
            if (item.id() == null) continue;
            if (!requestedIds.add(item.id())) {
                throw new IllegalArgumentException("Sub-lesson IDs must not be repeated");
            }
            if (!lessonRepository.subLessonBelongsToLesson(item.id(), lessonId)) {
                throw new ResourceNotFoundException("Sub-lesson " + item.id() + " not found");
            }
        }
        lessonRepository.reserveSubLessonPositions(lessonId, subLessons.size());
        List<Long> keepIds = new ArrayList<>();
        int position = 1;
        for (SubLessonWriteRequest item : subLessons) {
            if (item.id() != null) {
                lessonRepository.updateSubLesson(item.id(), item.name(), item.videoUrl(), position);
                keepIds.add(item.id());
            } else {
                Long id = lessonRepository.insertSubLesson(
                        lessonId, item.name(), item.videoUrl(), position);
                keepIds.add(id);
            }
            position++;
        }
        lessonRepository.deleteSubLessonsNotIn(lessonId, keepIds);
        lessonRepository.syncSubLessonCount(lessonId);
    }

    private void ensureCourseExists(Long courseId) {
        if (!lessonRepository.courseExists(courseId)) {
            throw new ResourceNotFoundException("Course " + courseId + " not found");
        }
    }

    private void ensureLessonExists(Long lessonId) {
        Long courseId = lessonRepository.findCourseId(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson " + lessonId + " not found"));
        // Use the same parent lock as course edits and lesson creation, in that order.
        if (!lessonRepository.lockCourse(courseId) || lessonRepository.findCourseId(lessonId).isEmpty()) {
            throw new ResourceNotFoundException("Lesson " + lessonId + " not found");
        }
    }
}
