package com.courseflow.upload;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class LocalCourseAssetStorageTests {
    @TempDir Path temp;
    private LocalCourseAssetStorage storage;
    @BeforeEach void setup() throws Exception { storage = new LocalCourseAssetStorage(temp.toString()); }

    @Test void storesActualCoverBytesAndIgnoresClientMimeType() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", bytes);
        var saved = storage.store("images", new MockMultipartFile("file", "../cover.png", "text/html", bytes.toByteArray()));
        assertThat(saved.url()).startsWith("/api/uploads/course-images/").endsWith(".png");
        assertThat(saved.contentType()).isEqualTo("image/png");
        assertThat(Files.readAllBytes(storage.resolve("images", filename(saved)))).isEqualTo(bytes.toByteArray());
    }

    @Test void storesPreviewAndResourceInSeparateDirectories() throws Exception {
        var video = storage.store("previews", new MockMultipartFile("file", "intro.mp4", "video/mp4", "video bytes".getBytes()));
        var notes = storage.store("resources", new MockMultipartFile("file", "notes.pdf", "application/pdf", "document bytes".getBytes()));
        assertThat(Files.readString(storage.resolve("previews", filename(video)))).isEqualTo("video bytes");
        assertThat(Files.readString(storage.resolve("resources", filename(notes)))).isEqualTo("document bytes");
        assertThat(storage.resolve("previews", filename(notes))).isNull();
        assertThat(storage.resolve("resources", "../../outside.pdf")).isNull();
    }

    @Test void rejectsInvalidEmptyAndOversizedFilesBeforeWriting() throws Exception {
        assertThatThrownBy(() -> storage.store("images", new MockMultipartFile("file", "cover.png", "image/png", "not an image".getBytes()))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.store("resources", new MockMultipartFile("file", "page.html", "text/html", "html".getBytes()))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.store("previews", new MockMultipartFile("file", "empty.mp4", "video/mp4", new byte[0]))).isInstanceOf(IllegalArgumentException.class);
        MultipartFile large = mock(MultipartFile.class);
        when(large.getSize()).thenReturn(6L * 1024 * 1024);
        assertThatThrownBy(() -> storage.store("images", large)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("5 MB");
        verify(large, never()).getInputStream();
    }

    private String filename(LocalCourseAssetStorage.StoredAsset stored) { return stored.url().substring(stored.url().lastIndexOf('/') + 1); }
}
