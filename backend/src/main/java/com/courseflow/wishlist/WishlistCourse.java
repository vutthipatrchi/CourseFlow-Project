package com.courseflow.wishlist;

import java.math.BigDecimal;

public record WishlistCourse(long id, String name, BigDecimal price, String category,
    String summary, String description, Integer learningTime, int lessons,
    String imageName, String accent) {}
