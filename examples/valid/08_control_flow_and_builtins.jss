struct StatSummary = {
    number count,
    number mean,
    number maxVal,
    boolean isValid,
}

number computeMean(number[] values) {
    number sum = 0;
    number i = 0;
    while (i < values.length) {
        sum += values[i];
        i++;
    }
    return sum / values.length;
}

number findMax(number[] values) {
    number maxV = values[0];
    number i = 1;
    while (i < values.length) {
        if (values[i] > maxV) {
            maxV = values[i];
        }
        i++;
    }
    return maxV;
}

void testControlFlowAndBuiltins() {
    number score = 85.5;
    string grade = "A";

    if (score >= 90) {
        grade = "A+";
    } else if (score >= 80) {
        grade = "A";
    } else {
        grade = "B";
    }

    number[] data = [10.5, 20.25, 30.75];
    data.push(40.5);

    number avg = computeMean(data);
    number maxItem = findMax(data);

    number roundedAvg = Math.round(avg);
    number sqrtMax = Math.sqrt(maxItem);
    number floorSqrt = Math.floor(sqrtMax);

    string message = "StaticScript Phase 1-3 Expanded!";
    number msgLen = message.length;
    boolean hasPhase = message.includes("Phase");
    number phaseIdx = message.indexOf("Phase");
    string subMsg = message.substring(0, 12);

    StatSummary summary = { count: data.length, mean: avg, maxVal: maxItem, isValid: true };
    log("Control flow and builtins tested successfully");
}

testControlFlowAndBuiltins();
