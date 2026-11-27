const triggers = document.querySelectorAll(".mega-trigger");

triggers.forEach(trigger => {

  let timeout;

  trigger.addEventListener("mouseenter", () => {

    clearTimeout(timeout);

    const menu = trigger.querySelector(".mega-menu");

    menu.style.visibility = "visible";
    menu.style.opacity = "1";
    menu.style.transform = "translateY(0px)";
  });

  trigger.addEventListener("mouseleave", () => {

    const menu = trigger.querySelector(".mega-menu");

    timeout = setTimeout(() => {

      menu.style.opacity = "0";
      menu.style.transform = "translateY(-12px)";

      setTimeout(() => {
        menu.style.visibility = "hidden";
      }, 300);

    }, 150);

  });

});

const accordionItems = document.querySelectorAll('.accordion-item');

accordionItems.forEach(item => {

    const header = item.querySelector('.accordion-header');

    header.addEventListener('click', () => {

        const isOpen = item.classList.contains('active');

        accordionItems.forEach(acc => {
            acc.classList.remove('active');
        });

        if (!isOpen) {
            item.classList.add('active');
        }

    });

});



/* =====================================================
   SAMPLE IMPACT ANALYZER
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const analyzer = document.getElementById("sample-analyzer");

    if (!analyzer) return;

    const modeButtons = document.querySelectorAll(".analysis-mode-button");

    const historicalData = document.getElementById("historicalData");
    const datasetName = document.getElementById("datasetName");
    const decimalPrecision = document.getElementById("decimalPrecision");
    const precisionField = document.getElementById("precisionField");

    const datasetTitle = document.getElementById("datasetTitle");
    const formatHelper = document.getElementById("formatHelper");
    const validSampleCount = document.getElementById("validSampleCount");
    const datasetError = document.getElementById("datasetError");

    const analyzeDatasetButton = document.getElementById("analyzeDatasetButton");
    const loadExampleButton = document.getElementById("loadExampleButton");
    const clearDatasetButton = document.getElementById("clearDatasetButton");

    const emptyAnalysis = document.getElementById("emptyAnalysis");
    const analysisResults = document.getElementById("analysisResults");
    const overallStatus = document.getElementById("overallStatus");

    const newSampleValue = document.getElementById("newSampleValue");
    const newSampleLabel = document.getElementById("newSampleLabel");
    const newSampleHelper = document.getElementById("newSampleHelper");
    const newSampleError = document.getElementById("newSampleError");

    const evaluateNewSampleButton =
        document.getElementById("evaluateNewSampleButton");

    const addNewSampleButton =
        document.getElementById("addNewSampleButton");

    const newSampleEmpty = document.getElementById("newSampleEmpty");
    const newSampleResults = document.getElementById("newSampleResults");

    let currentMode = "bolus";
    let currentDataset = [];
    let lastEvaluatedSample = null;

    const storageKeys = {
        bolus: "sampleAnalyzerBolusData",
        occlusion: "sampleAnalyzerOcclusionData",
        bolusName: "sampleAnalyzerBolusName",
        occlusionName: "sampleAnalyzerOcclusionName"
    };

    /* =====================================================
       MODES
    ===================================================== */

    modeButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            saveCurrentDataset();

            modeButtons.forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            currentMode = button.dataset.analysisMode;

            configureMode();
            loadSavedDataset();
            resetDisplayedAnalysis();
            updateValidSampleCount();

        });

    });

    function configureMode() {

        datasetError.textContent = "";
        newSampleError.textContent = "";
        newSampleValue.value = "";
        addNewSampleButton.disabled = true;
        lastEvaluatedSample = null;

        if (currentMode === "bolus") {

            datasetTitle.textContent = "Bolus Dataset";

            formatHelper.textContent =
                "Enter one bolus weight per line. Up to 6 decimals are accepted.";

            historicalData.placeholder =
                "5.001245\n5.008562\n4.995830\n5.002451";

            precisionField.style.display = "block";

            newSampleLabel.textContent = "New bolus weight";

            newSampleValue.placeholder = "Example: 5.004582";

            newSampleHelper.textContent =
                "Enter a value with up to 6 decimal places.";

        } else {

            datasetTitle.textContent = "Occlusion Dataset";

            formatHelper.textContent =
                "Enter one occlusion time per line using HH:MM:SS.";

            historicalData.placeholder =
                "00:12:04\n00:12:08\n00:12:11\n00:12:06";

            precisionField.style.display = "none";

            newSampleLabel.textContent = "New occlusion time";

            newSampleValue.placeholder = "Example: 00:13:00";

            newSampleHelper.textContent =
                "Required format: HH:MM:SS.";

        }

    }

    /* =====================================================
       PARSING
    ===================================================== */

    function parseDataset(showErrors = true) {

        const rawLines = historicalData.value
            .split(/\n|,|;/)
            .map(function (line) {
                return line.trim();
            })
            .filter(Boolean);

        const values = [];
        const invalidValues = [];

        rawLines.forEach(function (value, index) {

            let parsedValue;

            if (currentMode === "bolus") {

                const normalizedValue = value.replace(",", ".");

                if (!/^-?\d+(\.\d{1,6})?$/.test(normalizedValue)) {
                    invalidValues.push(`${index + 1}: ${value}`);
                    return;
                }

                parsedValue = Number(normalizedValue);

            } else {

                parsedValue = timeToSeconds(value);

                if (parsedValue === null) {
                    invalidValues.push(`${index + 1}: ${value}`);
                    return;
                }

            }

            if (Number.isFinite(parsedValue)) {
                values.push(parsedValue);
            }

        });

        if (showErrors) {

            if (invalidValues.length > 0) {

                datasetError.textContent =
                    `Invalid entries: ${invalidValues.slice(0, 4).join(", ")}`
                    + (invalidValues.length > 4 ? "..." : "");

            } else {

                datasetError.textContent = "";

            }

        }

        return {
            values,
            invalidValues
        };

    }

    function parseSingleValue(value) {

        const cleanValue = value.trim();

        if (currentMode === "bolus") {

            const normalizedValue = cleanValue.replace(",", ".");

            if (!/^-?\d+(\.\d{1,6})?$/.test(normalizedValue)) {
                return null;
            }

            return Number(normalizedValue);

        }

        return timeToSeconds(cleanValue);

    }

    function timeToSeconds(timeValue) {

        const match = timeValue.match(/^(\d{1,3}):([0-5]\d):([0-5]\d)$/);

        if (!match) return null;

        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        const seconds = Number(match[3]);

        return (hours * 3600) + (minutes * 60) + seconds;

    }

    function secondsToTime(totalSeconds) {

        const roundedSeconds = Math.round(totalSeconds);

        const hours = Math.floor(roundedSeconds / 3600);
        const minutes = Math.floor((roundedSeconds % 3600) / 60);
        const seconds = roundedSeconds % 60;

        return (
            String(hours).padStart(2, "0") + ":" +
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0")
        );

    }

    function formatValue(value) {

        if (!Number.isFinite(value)) return "—";

        if (currentMode === "occlusion") {
            return secondsToTime(value);
        }

        const precision = Number(decimalPrecision.value);

        return value.toFixed(precision);

    }

    function formatStandardDeviation(value) {

        if (currentMode === "occlusion") {

            if (value < 60) {
                return `${value.toFixed(2)} s`;
            }

            return secondsToTime(value);

        }

        return value.toFixed(Number(decimalPrecision.value));

    }

    /* =====================================================
       STATISTICS
    ===================================================== */

    function mean(values) {

        return values.reduce(function (sum, value) {
            return sum + value;
        }, 0) / values.length;

    }

    function sampleStandardDeviation(values) {

        if (values.length < 2) return 0;

        const average = mean(values);

        const squaredDifferences = values.map(function (value) {
            return Math.pow(value - average, 2);
        });

        const variance =
            squaredDifferences.reduce(function (sum, value) {
                return sum + value;
            }, 0) / (values.length - 1);

        return Math.sqrt(variance);

    }

    function median(values) {

        const sorted = [...values].sort(function (a, b) {
            return a - b;
        });

        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }

        return sorted[middle];

    }

    function percentile(values, percentileValue) {

        const sorted = [...values].sort(function (a, b) {
            return a - b;
        });

        const position = (sorted.length - 1) * percentileValue;
        const lower = Math.floor(position);
        const upper = Math.ceil(position);
        const weight = position - lower;

        if (upper >= sorted.length) {
            return sorted[lower];
        }

        return (
            sorted[lower] * (1 - weight) +
            sorted[upper] * weight
        );

    }

    function medianAbsoluteDeviation(values) {

        const datasetMedian = median(values);

        const deviations = values.map(function (value) {
            return Math.abs(value - datasetMedian);
        });

        return median(deviations);

    }

    function calculateModifiedZScore(value, values) {

        const datasetMedian = median(values);
        const mad = medianAbsoluteDeviation(values);

        if (mad === 0) {

            const stdDev = sampleStandardDeviation(values);

            if (stdDev === 0) {
                return value === datasetMedian ? 0 : Infinity;
            }

            return (value - mean(values)) / stdDev;

        }

        return 0.6745 * (value - datasetMedian) / mad;

    }

    function calculateZScore(value, values) {

        const average = mean(values);
        const stdDev = sampleStandardDeviation(values);

        if (stdDev === 0) {
            return value === average ? 0 : Infinity;
        }

        return (value - average) / stdDev;

    }

    function getIqrLimits(values) {

        const q1 = percentile(values, 0.25);
        const q3 = percentile(values, 0.75);
        const iqr = q3 - q1;

        return {
            q1,
            q3,
            iqr,
            lower: q1 - (1.5 * iqr),
            upper: q3 + (1.5 * iqr),
            extremeLower: q1 - (3 * iqr),
            extremeUpper: q3 + (3 * iqr)
        };

    }

    /*
       Jarque-Bera screening approximation.

       For 2 degrees of freedom:
       p-value approximation = exp(-JB / 2).

       This is presented as a distribution-risk screen,
       not as a substitute for Minitab normality testing.
    */

    function jarqueBeraTest(values) {

        const n = values.length;

        if (n < 8) {
            return {
                statistic: 0,
                pValue: 1,
                status: "INSUFFICIENT"
            };
        }

        const average = mean(values);

        const deviations = values.map(function (value) {
            return value - average;
        });

        const m2 =
            deviations.reduce(function (sum, value) {
                return sum + Math.pow(value, 2);
            }, 0) / n;

        if (m2 === 0) {
            return {
                statistic: 0,
                pValue: 1,
                status: "STABLE"
            };
        }

        const m3 =
            deviations.reduce(function (sum, value) {
                return sum + Math.pow(value, 3);
            }, 0) / n;

        const m4 =
            deviations.reduce(function (sum, value) {
                return sum + Math.pow(value, 4);
            }, 0) / n;

        const skewness = m3 / Math.pow(m2, 1.5);
        const kurtosis = m4 / Math.pow(m2, 2);

        const statistic =
            (n / 6) *
            (
                Math.pow(skewness, 2) +
                Math.pow(kurtosis - 3, 2) / 4
            );

        const pValue = Math.exp(-statistic / 2);

        return {
            statistic,
            pValue,
            status: pValue < 0.05 ? "RISK" : "STABLE"
        };

    }

    /* =====================================================
       OUTLIER ANALYSIS
    ===================================================== */

    function analyzeObservations(values) {

        const limits = getIqrLimits(values);

        return values.map(function (value, index) {

            const comparisonValues = values.filter(function (_, itemIndex) {
                return itemIndex !== index;
            });

            const modifiedZ = calculateModifiedZScore(
                value,
                comparisonValues.length >= 4 ? comparisonValues : values
            );

            const zScore = calculateZScore(
                value,
                comparisonValues.length >= 4 ? comparisonValues : values
            );

            const outsideIqr =
                value < limits.lower ||
                value > limits.upper;

            const outsideExtremeIqr =
                value < limits.extremeLower ||
                value > limits.extremeUpper;

            const absoluteModifiedZ = Math.abs(modifiedZ);
            const absoluteZScore = Math.abs(zScore);

            let risk = "LOW";

            if (
                outsideExtremeIqr ||
                absoluteModifiedZ >= 5 ||
                absoluteZScore >= 4
            ) {

                risk = "CRITICAL";

            } else if (
                outsideIqr ||
                absoluteModifiedZ >= 3.5 ||
                absoluteZScore >= 3
            ) {

                risk = "HIGH";

            } else if (
                absoluteModifiedZ >= 2.5 ||
                absoluteZScore >= 2
            ) {

                risk = "MODERATE";

            }

            return {
                index,
                value,
                zScore,
                modifiedZ,
                outsideIqr,
                outsideExtremeIqr,
                risk,
                flagged: risk === "HIGH" || risk === "CRITICAL"
            };

        });

    }

    function calculateDatasetRisk(observations) {

        const criticalCount = observations.filter(function (observation) {
            return observation.risk === "CRITICAL";
        }).length;

        const highCount = observations.filter(function (observation) {
            return observation.risk === "HIGH";
        }).length;

        const moderateCount = observations.filter(function (observation) {
            return observation.risk === "MODERATE";
        }).length;

        if (criticalCount > 0) return "CRITICAL";
        if (highCount > 0) return "HIGH";
        if (moderateCount > 0) return "MODERATE";

        return "LOW";

    }

    /* =====================================================
       DATASET ANALYSIS
    ===================================================== */

    function analyzeDataset() {

        const parsedDataset = parseDataset(true);

        if (parsedDataset.invalidValues.length > 0) {
            return;
        }

        if (parsedDataset.values.length < 8) {

            datasetError.textContent =
                "Enter at least 8 valid measurements. Twenty or more are recommended.";

            return;

        }

        currentDataset = parsedDataset.values;

        saveCurrentDataset();

        const observations = analyzeObservations(currentDataset);

        const flaggedObservations = observations.filter(function (observation) {
            return observation.flagged;
        });

        const datasetMean = mean(currentDataset);
        const datasetStdDev = sampleStandardDeviation(currentDataset);
        const minimum = Math.min(...currentDataset);
        const maximum = Math.max(...currentDataset);

        const risk = calculateDatasetRisk(observations);
        const normalityScreen = jarqueBeraTest(currentDataset);

        showDatasetAnalysis({
            values: currentDataset,
            observations,
            flaggedObservations,
            datasetMean,
            datasetStdDev,
            minimum,
            maximum,
            risk,
            normalityScreen
        });

    }

    function showDatasetAnalysis(result) {

        emptyAnalysis.classList.add("hidden");
        analysisResults.classList.remove("hidden");

        const primaryAlert = document.getElementById("primaryAlert");
        const primaryAlertSymbol =
            document.getElementById("primaryAlertSymbol");

        const primaryAlertTitle =
            document.getElementById("primaryAlertTitle");

        const primaryAlertText =
            document.getElementById("primaryAlertText");

        primaryAlert.className =
            `analysis-alert ${result.risk.toLowerCase()}`;

        overallStatus.className =
            `overall-status ${result.risk.toLowerCase()}`;

        overallStatus.textContent = `${result.risk} RISK`;

        if (result.risk === "CRITICAL" || result.risk === "HIGH") {

            primaryAlertSymbol.textContent = "⚠";

            primaryAlertTitle.textContent =
                "Extremely atypical result detected.";

            primaryAlertText.textContent =
                "At least one sample is outside the expected process variation "
                + "and may significantly impact distribution analysis.";

        } else if (result.risk === "MODERATE") {

            primaryAlertSymbol.textContent = "!";

            primaryAlertTitle.textContent =
                "A measurement requires additional review.";

            primaryAlertText.textContent =
                "One or more samples are outside the central grouping, "
                + "but the current evidence is not sufficient to classify "
                + "them as strong outliers.";

        } else {

            primaryAlertSymbol.textContent = "✓";

            primaryAlertTitle.textContent =
                "Dataset appears consistent.";

            primaryAlertText.textContent =
                "No strongly atypical measurements were detected "
                + "using the current screening rules.";

        }

        document.getElementById("summarySampleSize").textContent =
            result.values.length;

        document.getElementById("summaryMean").textContent =
            formatValue(result.datasetMean);

        document.getElementById("summaryStdDev").textContent =
            formatStandardDeviation(result.datasetStdDev);

        document.getElementById("summaryOutliers").textContent =
            result.flaggedObservations.length;

        document.getElementById("summaryRange").textContent =
            `${formatValue(result.minimum)} – ${formatValue(result.maximum)}`;

        document.getElementById("summaryRisk").textContent =
            result.risk;

        document.getElementById("summaryMeanUnit").textContent =
            currentMode === "bolus" ? "Bolus weight" : "Occlusion time";

        document.getElementById("summaryStdDevUnit").textContent =
            currentMode === "bolus" ? "Weight variation" : "Time variation";

        renderDistributionChart(
            result.values,
            result.observations,
            result.minimum,
            result.maximum
        );

        renderFlaggedSamples(result.flaggedObservations);
        renderDatasetHealth(result);

    }

    /* =====================================================
       DISTRIBUTION VISUAL
    ===================================================== */

    function renderDistributionChart(
        values,
        observations,
        minimum,
        maximum
    ) {

        const chart = document.getElementById("distributionChart");

        chart.innerHTML = "";

        const range = maximum - minimum || 1;

        observations.forEach(function (observation, index) {

            const point = document.createElement("button");

            point.type = "button";

            point.className =
                "distribution-point"
                + (observation.flagged ? " flagged" : "");

            const percentage =
                ((observation.value - minimum) / range) * 92 + 4;

            const row = index % 5;

            point.style.left = `${percentage}%`;
            point.style.bottom = `${18 + row * 20}px`;

            point.title =
                `Sample ${index + 1}: ${formatValue(observation.value)}`
                + ` | Modified Z: ${formatScore(observation.modifiedZ)}`
                + ` | Risk: ${observation.risk}`;

            chart.appendChild(point);

        });

        document.getElementById("axisMinimum").textContent =
            formatValue(minimum);

        document.getElementById("axisMedian").textContent =
            `Median: ${formatValue(median(values))}`;

        document.getElementById("axisMaximum").textContent =
            formatValue(maximum);

    }

    function renderFlaggedSamples(flaggedObservations) {

        const list = document.getElementById("flaggedSamplesList");
        const reviewCount = document.getElementById("reviewCount");

        list.innerHTML = "";

        reviewCount.textContent =
            `${flaggedObservations.length} flagged`;

        if (flaggedObservations.length === 0) {

            list.innerHTML = `
                <div class="no-flagged-samples">
                    No observations currently meet the high-risk
                    outlier screening criteria.
                </div>
            `;

            return;

        }

        flaggedObservations.forEach(function (observation) {

            const item = document.createElement("div");

            item.className = "flagged-sample";

            item.innerHTML = `
                <span class="flagged-index">
                    ${String(observation.index + 1).padStart(2, "0")}
                </span>

                <div class="flagged-description">
                    <strong>${formatValue(observation.value)}</strong>

                    <span>
                        Z-Score: ${formatScore(observation.zScore)}
                        · Modified Z: ${formatScore(observation.modifiedZ)}
                    </span>
                </div>

                <span class="flagged-risk">
                    ${observation.risk}
                </span>
            `;

            list.appendChild(item);

        });

    }

    function renderDatasetHealth(result) {

        const flaggedPercentage =
            result.flaggedObservations.length / result.values.length;

        let score = 100;

        score -= Math.round(flaggedPercentage * 100);
        score -= result.risk === "MODERATE" ? 10 : 0;
        score -= result.risk === "HIGH" ? 25 : 0;
        score -= result.risk === "CRITICAL" ? 40 : 0;
        score -= result.normalityScreen.status === "RISK" ? 15 : 0;

        score = Math.max(0, Math.min(100, score));

        document.getElementById("healthScore").textContent = score;

        const title = document.getElementById("datasetHealthTitle");
        const text = document.getElementById("datasetHealthText");

        if (result.risk === "CRITICAL" || result.risk === "HIGH") {

            title.textContent = "Dataset review recommended";

            text.textContent =
                "At least one result may have a meaningful influence on "
                + "variation or distribution characteristics. Review the raw "
                + "data and test conditions before statistical disposition.";

        } else if (result.risk === "MODERATE") {

            title.textContent = "Dataset requires attention";

            text.textContent =
                "The dataset contains a measurement outside the central group. "
                + "Continue monitoring and compare it with protocol requirements.";

        } else {

            title.textContent = "Stable dataset";

            text.textContent =
                "The current measurements show no strong evidence of "
                + "unusually influential observations.";

        }

    }

    /* =====================================================
       NEW SAMPLE EVALUATION
    ===================================================== */

    function evaluateNewSample() {

        newSampleError.textContent = "";

        const parsedDataset = parseDataset(true);

        if (parsedDataset.invalidValues.length > 0) return;

        if (parsedDataset.values.length < 8) {

            newSampleError.textContent =
                "Analyze or enter at least 8 historical samples first.";

            return;

        }

        const sample = parseSingleValue(newSampleValue.value);

        if (sample === null || !Number.isFinite(sample)) {

            newSampleError.textContent =
                currentMode === "bolus"
                    ? "Enter a valid number with up to 6 decimal places."
                    : "Enter a valid time using HH:MM:SS.";

            return;

        }

        currentDataset = parsedDataset.values;
        lastEvaluatedSample = sample;

        const historicalMean = mean(currentDataset);

        const historicalStdDev =
            sampleStandardDeviation(currentDataset);

        const zScore =
            calculateZScore(sample, currentDataset);

        const modifiedZScore =
            calculateModifiedZScore(sample, currentDataset);

        const iqrLimits =
            getIqrLimits(currentDataset);

        const outsideIqr =
            sample < iqrLimits.lower ||
            sample > iqrLimits.upper;

        const outsideExtremeIqr =
            sample < iqrLimits.extremeLower ||
            sample > iqrLimits.extremeUpper;

        const absoluteZ = Math.abs(zScore);
        const absoluteModifiedZ = Math.abs(modifiedZScore);

        let risk = "LOW";

        if (
            outsideExtremeIqr ||
            absoluteModifiedZ >= 5 ||
            absoluteZ >= 4
        ) {

            risk = "CRITICAL";

        } else if (
            outsideIqr ||
            absoluteModifiedZ >= 3.5 ||
            absoluteZ >= 3
        ) {

            risk = "HIGH";

        } else if (
            absoluteModifiedZ >= 2.5 ||
            absoluteZ >= 2
        ) {

            risk = "MODERATE";

        }

        const potentialOutlier =
            risk === "HIGH" || risk === "CRITICAL";

        const deviationPercent =
            historicalMean === 0
                ? 0
                : ((sample - historicalMean) / Math.abs(historicalMean)) * 100;

        const combinedDataset = [...currentDataset, sample];

        const newMean = mean(combinedDataset);
        const newStdDev = sampleStandardDeviation(combinedDataset);

        const stdDevIncrease =
            historicalStdDev === 0
                ? (newStdDev > 0 ? Infinity : 0)
                : ((newStdDev - historicalStdDev) / historicalStdDev) * 100;

        const beforeNormality = jarqueBeraTest(currentDataset);
        const afterNormality = jarqueBeraTest(combinedDataset);

        const normalityChangedToRisk =
            beforeNormality.status !== "RISK" &&
            afterNormality.status === "RISK";

        const impactRisk =
            normalityChangedToRisk ||
            stdDevIncrease >= 25 ||
            potentialOutlier;

        showNewSampleAnalysis({
            sample,
            historicalMean,
            historicalStdDev,
            zScore,
            modifiedZScore,
            deviationPercent,
            risk,
            potentialOutlier,
            newMean,
            newStdDev,
            stdDevIncrease,
            beforeNormality,
            afterNormality,
            normalityChangedToRisk,
            impactRisk
        });

        addNewSampleButton.disabled = false;

    }

    function showNewSampleAnalysis(result) {

        newSampleEmpty.classList.add("hidden");
        newSampleResults.classList.remove("hidden");

        const riskElement = document.getElementById("newSampleRisk");
        const outlierElement = document.getElementById("newSampleOutlier");

        const alert = document.getElementById("newSampleAlert");
        const alertTitle =
            document.getElementById("newSampleAlertTitle");

        const alertText =
            document.getElementById("newSampleAlertText");

        riskElement.textContent = result.risk;

        outlierElement.textContent =
            `Potential Outlier: ${result.potentialOutlier ? "YES" : "NO"}`;

        outlierElement.className =
            `sample-outlier-badge ${result.potentialOutlier ? "yes" : "no"}`;

        alert.className =
            `new-sample-alert ${result.risk.toLowerCase()}`;

        if (result.risk === "CRITICAL" || result.risk === "HIGH") {

            alertTitle.textContent =
                "⚠ Extremely atypical result.";

            alertText.textContent =
                "This sample is outside the expected process variation "
                + "and may significantly impact distribution analysis.";

        } else if (result.risk === "MODERATE") {

            alertTitle.textContent =
                "⚠ Sample requires additional review.";

            alertText.textContent =
                "This result is outside the central historical grouping, "
                + "but it does not meet the strongest outlier criteria.";

        } else {

            alertTitle.textContent =
                "✓ Sample is consistent with the historical dataset.";

            alertText.textContent =
                "This result remains within the expected historical variation.";

        }

        document.getElementById("newHistoricalMean").textContent =
            formatValue(result.historicalMean);

        document.getElementById("newHistoricalStdDev").textContent =
            formatStandardDeviation(result.historicalStdDev);

        document.getElementById("newSampleDisplay").textContent =
            formatValue(result.sample);

        document.getElementById("newDistanceMean").textContent =
            `${result.deviationPercent >= 0 ? "+" : ""}`
            + `${result.deviationPercent.toFixed(2)}%`;

        document.getElementById("newZScore").textContent =
            formatScore(result.zScore);

        document.getElementById("newModifiedZScore").textContent =
            formatScore(result.modifiedZScore);

        document.getElementById("beforeMean").textContent =
            formatValue(result.historicalMean);

        document.getElementById("afterMean").textContent =
            formatValue(result.newMean);

        document.getElementById("beforeStatus").textContent =
            result.beforeNormality.status === "RISK"
                ? "Distribution risk detected"
                : "Baseline distribution";

        document.getElementById("afterStatus").textContent =
            result.afterNormality.status === "RISK"
                ? "Distribution risk detected"
                : "No new screening risk";

        const impactMessage =
            document.getElementById("distributionImpactMessage");

        if (result.impactRisk) {

            impactMessage.classList.remove("hidden");

            if (result.normalityChangedToRisk) {

                impactMessage.querySelector("strong").textContent =
                    "⚠ Adding this sample may cause loss of normality "
                    + "and affect downstream statistical analysis.";

            } else {

                impactMessage.querySelector("strong").textContent =
                    "⚠ Adding this sample may increase distribution risk.";

            }

        } else {

            impactMessage.classList.add("hidden");

        }

        const recommendation =
            document.getElementById("newSampleRecommendation");

        if (result.risk === "CRITICAL" || result.risk === "HIGH") {

            recommendation.textContent =
                "Review setup, measurement system, sample condition, "
                + "test execution, equipment status, and raw data before "
                + "inclusion in final analysis. Do not remove the result "
                + "without documented technical justification.";

        } else if (result.risk === "MODERATE") {

            recommendation.textContent =
                "Confirm the test conditions and compare the result with "
                + "the applicable acceptance criteria. Continue monitoring "
                + "for similar observations.";

        } else {

            recommendation.textContent =
                "The sample is statistically consistent with the historical "
                + "dataset. Continue according to the applicable test procedure "
                + "and acceptance criteria.";

        }

    }

    function formatScore(score) {

        if (score === Infinity) return "+∞";
        if (score === -Infinity) return "-∞";
        if (!Number.isFinite(score)) return "—";

        return score.toFixed(2);

    }

    /* =====================================================
       ADD NEW SAMPLE
    ===================================================== */

    addNewSampleButton.addEventListener("click", function () {

        if (lastEvaluatedSample === null) return;

        let formattedNewValue;

        if (currentMode === "bolus") {

            const originalValue = newSampleValue.value.trim();

            formattedNewValue = originalValue.replace(",", ".");

        } else {

            formattedNewValue = secondsToTime(lastEvaluatedSample);

        }

        const currentText = historicalData.value.trim();

        historicalData.value =
            currentText
                ? `${currentText}\n${formattedNewValue}`
                : formattedNewValue;

        saveCurrentDataset();

        updateValidSampleCount();

        newSampleValue.value = "";
        newSampleError.textContent = "";
        lastEvaluatedSample = null;

        addNewSampleButton.disabled = true;

        newSampleResults.classList.add("hidden");
        newSampleEmpty.classList.remove("hidden");

        analyzeDataset();

    });

    /* =====================================================
       STORAGE
    ===================================================== */

    function saveCurrentDataset() {

        const dataKey =
            currentMode === "bolus"
                ? storageKeys.bolus
                : storageKeys.occlusion;

        const nameKey =
            currentMode === "bolus"
                ? storageKeys.bolusName
                : storageKeys.occlusionName;

        localStorage.setItem(dataKey, historicalData.value);
        localStorage.setItem(nameKey, datasetName.value);

    }

    function loadSavedDataset() {

        const dataKey =
            currentMode === "bolus"
                ? storageKeys.bolus
                : storageKeys.occlusion;

        const nameKey =
            currentMode === "bolus"
                ? storageKeys.bolusName
                : storageKeys.occlusionName;

        historicalData.value =
            localStorage.getItem(dataKey) || "";

        datasetName.value =
            localStorage.getItem(nameKey) || "";

    }

    historicalData.addEventListener("input", function () {
        updateValidSampleCount();
        saveCurrentDataset();
    });

    datasetName.addEventListener("input", saveCurrentDataset);

    decimalPrecision.addEventListener("change", function () {
        localStorage.setItem(
            "sampleAnalyzerPrecision",
            decimalPrecision.value
        );

        if (currentDataset.length >= 8) {
            analyzeDataset();
        }
    });

    function updateValidSampleCount() {

        const parsedDataset = parseDataset(false);

        validSampleCount.textContent =
            parsedDataset.values.length;

    }

    /* =====================================================
       EXAMPLES AND RESET
    ===================================================== */

    loadExampleButton.addEventListener("click", function () {

        if (currentMode === "bolus") {

            historicalData.value = [
                "5.001245",
                "4.998410",
                "5.003125",
                "5.000840",
                "4.997950",
                "5.002731",
                "5.004206",
                "4.999382",
                "5.001906",
                "5.000115",
                "4.996842",
                "5.003614",
                "5.001078",
                "4.999740",
                "5.002480",
                "4.998925",
                "5.000632",
                "5.003057",
                "4.997614",
                "5.001521",
                "5.004011",
                "4.999167",
                "5.002098",
                "5.000391",
                "4.998216",
                "5.003842",
                "5.001334",
                "4.997305",
                "5.000954",
                "5.035000"
            ].join("\n");

            datasetName.value = "Bolus Example Dataset";

        } else {

            historicalData.value = [
                "00:12:04",
                "00:12:08",
                "00:12:11",
                "00:12:06",
                "00:12:09",
                "00:12:03",
                "00:12:07",
                "00:12:10",
                "00:12:05",
                "00:12:12",
                "00:12:08",
                "00:12:06",
                "00:12:09",
                "00:12:04",
                "00:12:07",
                "00:12:11",
                "00:12:05",
                "00:12:08",
                "00:12:10",
                "00:12:06",
                "00:12:03",
                "00:12:09",
                "00:12:07",
                "00:12:05",
                "00:12:11",
                "00:12:08",
                "00:12:04",
                "00:12:10",
                "00:12:06",
                "00:13:00"
            ].join("\n");

            datasetName.value = "Occlusion Example Dataset";

        }

        updateValidSampleCount();
        saveCurrentDataset();
        analyzeDataset();

    });

    clearDatasetButton.addEventListener("click", function () {

        historicalData.value = "";
        datasetName.value = "";
        currentDataset = [];
        lastEvaluatedSample = null;

        saveCurrentDataset();
        updateValidSampleCount();
        resetDisplayedAnalysis();

        datasetError.textContent = "";
        newSampleError.textContent = "";
        newSampleValue.value = "";

    });

    function resetDisplayedAnalysis() {

        emptyAnalysis.classList.remove("hidden");
        analysisResults.classList.add("hidden");

        newSampleEmpty.classList.remove("hidden");
        newSampleResults.classList.add("hidden");

        addNewSampleButton.disabled = true;

        overallStatus.className =
            "overall-status neutral";

        overallStatus.textContent =
            "Waiting for data";

    }

    /* =====================================================
       BUTTON EVENTS
    ===================================================== */

    analyzeDatasetButton.addEventListener(
        "click",
        analyzeDataset
    );

    evaluateNewSampleButton.addEventListener(
        "click",
        evaluateNewSample
    );

    newSampleValue.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            evaluateNewSample();
        }

    });

    /* =====================================================
       INITIALIZE
    ===================================================== */

    const savedPrecision =
        localStorage.getItem("sampleAnalyzerPrecision");

    if (savedPrecision) {
        decimalPrecision.value = savedPrecision;
    }

    configureMode();
    loadSavedDataset();
    updateValidSampleCount();

});