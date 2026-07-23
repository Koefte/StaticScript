struct Rectangle = {
    number width,
    number height,
}

number calculateArea(Rectangle rect) {
    return rect.width * rect.height;
}

Rectangle r = { width: 5, height: 4 };
number area = calculateArea(r);
