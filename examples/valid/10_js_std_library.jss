void testStandardJavaScriptLibrary() {
    console.log("=== Testing Standard JavaScript Library Support ===");

    number piValue = Math.PI;
    number roundedUp = Math.ceil(4.2);
    number squareRoot = Math.sqrt(49.0);
    number timestamp = Date.now();

    number parsedInt = parseInt("123");
    number parsedFloat = parseFloat("45.67");
    boolean checkNaN = isNaN(parsedFloat);
    boolean checkFinite = isFinite(parsedInt);

    string numStr = String(100);
    number strNum = Number("200");
    boolean boolVal = Boolean(1);

    string greeting = "  Hello StaticScript World!  ";
    string trimmed = greeting.trim();
    string lower = trimmed.toLowerCase();
    string upper = trimmed.toUpperCase();
    boolean startsWithHello = trimmed.startsWith("Hello");
    boolean endsWithWorld = trimmed.endsWith("World!");
    string slicedStr = trimmed.slice(0, 5);
    string replaced = trimmed.replace("World!", "Developer!");
    number lastIdx = trimmed.lastIndexOf("o");

    string[] words = trimmed.split(" ");
    number wordCount = words.length;

    number[] numbers = [1, 2, 3];
    numbers.push(4);
    numbers.unshift(0);
    number firstItem = numbers.shift();
    number lastItem = numbers.pop();
    number[] slicedArr = numbers.slice(0, 2);
    number[] reversedArr = numbers.reverse();
    string joinedStr = numbers.join(", ");
    boolean isArr = Array.isArray(numbers);

    console.log("Standard JS Library tests completed successfully!");
}

testStandardJavaScriptLibrary();
