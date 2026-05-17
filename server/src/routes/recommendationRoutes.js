const express = require("express");
const Product = require("../models/productModel");

const router = express.Router();

const clamp = (value, min = 0, max = 100) => {
  return Math.max(min, Math.min(max, Math.round(value)));
};

const cleanProductName = (name = "") => {
  const normalizedName = String(name).replace(/\s+/g, " ").trim();

  return normalizedName
    .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\+\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, "")
    .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\/\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, "")
    .replace(/\s+\d+\s*GB\s*(?:RAM)?$/i, "")
    .trim() || normalizedName;
};

const profileDefaults = {
  gamer: {
    performance: 90,
    camera: 30,
    battery: 70,
    gaming: 100,
    design: 50,
    display: 80,
    value: 50
  },
  creator: {
    performance: 80,
    camera: 100,
    battery: 70,
    gaming: 40,
    design: 80,
    display: 95,
    value: 50
  },
  professional: {
    performance: 75,
    camera: 50,
    battery: 100,
    gaming: 30,
    design: 75,
    display: 70,
    value: 65
  },
  power_user: {
    performance: 100,
    camera: 70,
    battery: 85,
    gaming: 90,
    design: 70,
    display: 90,
    value: 50
  },
  budget_smart: {
    performance: 65,
    camera: 50,
    battery: 80,
    gaming: 50,
    design: 50,
    display: 60,
    value: 100
  }
};

const scoreFields = [
  ["performance", "performanceScore"],
  ["camera", "cameraScore"],
  ["battery", "batteryScore"],
  ["gaming", "gamingScore"],
  ["design", "designScore"],
  ["display", "displayScore"],
  ["value", "valueScore"]
];

const tierRank = {
  entry: 1,
  midrange: 2,
  "upper-midrange": 3,
  flagship: 4
};

const intentLabels = {
  gamer: ["gamer", "gaming", "heavy gamers"],
  creator: ["creator", "content creators", "photography"],
  professional: ["business", "professional", "everyday use"],
  power_user: ["power", "heavy gamers", "content creators"],
  budget_smart: ["everyday use", "value", "budget"]
};

const calculateBudgetFit = (price, budget) => {
  if (!budget || budget <= 0) {
    return {
      score: 72,
      penalty: 0,
      label: "No budget cap applied"
    };
  }

  if (price > budget) {
    const excessRatio = (price - budget) / budget;
    return {
      score: clamp(70 - excessRatio * 120),
      penalty: Math.min(38, 12 + excessRatio * 42),
      label: `Over budget by ₹${Math.round(price - budget).toLocaleString("en-IN")}`
    };
  }

  const targetPrice = budget * 0.82;
  const distanceRatio = Math.abs(price - targetPrice) / budget;
  const score = clamp(100 - distanceRatio * 58);

  return {
    score,
    penalty: 0,
    label: `₹${Math.round(budget - price).toLocaleString("en-IN")} under budget`
  };
};

const calculateAdvancedFit = (product, advanced = {}) => {
  let score = 100;
  const misses = [];

  const minRam = Number(advanced.ram || 0);
  const minStorage = Number(advanced.storage || 0);
  const requestedTier = advanced.processorTier;

  if (minRam && product.ram < minRam) {
    score -= Math.min(24, (minRam - product.ram) * 4);
    misses.push(`RAM below ${minRam}GB target`);
  }

  if (minStorage && product.storage < minStorage) {
    score -= Math.min(24, ((minStorage - product.storage) / minStorage) * 30);
    misses.push(`Storage below ${minStorage}GB target`);
  }

  if (requestedTier && tierRank[requestedTier]) {
    const currentRank = tierRank[product.processorTier] || 1;
    const requiredRank = tierRank[requestedTier];

    if (currentRank < requiredRank) {
      score -= (requiredRank - currentRank) * 14;
      misses.push(`Processor tier below ${requestedTier}`);
    } else if (currentRank > requiredRank) {
      score += 3;
    }
  }

  return {
    score: clamp(score),
    misses
  };
};

const getMatchTier = (score) => {
  if (score >= 88) return "Excellent fit";
  if (score >= 76) return "Strong fit";
  if (score >= 64) return "Balanced fit";
  if (score >= 50) return "Compromise fit";
  return "Low fit";
};

const getTopStrengths = (product) => {
  return [
    ["Performance", product.performanceScore],
    ["Camera", product.cameraScore],
    ["Battery", product.batteryScore],
    ["Gaming", product.gamingScore],
    ["Display", product.displayScore],
    ["Design", product.designScore],
    ["Value", product.valueScore]
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, score]) => `${label} ${score}/100`);
};

const formatStorage = (storage) => {
  return storage >= 1024
    ? `${storage / 1024}TB`
    : `${storage}GB`;
};

const buildVariantMeta = (products) => {
  return products.reduce((meta, productDocument) => {
    const product = productDocument.toObject();
    const baseName = cleanProductName(product.name);
    const key = `${product.brand}|${product.category}|${baseName}`;

    if (!meta[key]) {
      meta[key] = {
        count: 0,
        minPrice: product.price,
        configurations: new Set(),
        storages: new Set(),
        ramOptions: new Set()
      };
    }

    const configurationKey = `${product.ram}|${product.storage}`;

    if (!meta[key].configurations.has(configurationKey)) {
      meta[key].count += 1;
    }

    meta[key].configurations.add(configurationKey);
    meta[key].minPrice = Math.min(meta[key].minPrice, product.price);
    meta[key].storages.add(product.storage);
    meta[key].ramOptions.add(product.ram);

    return meta;
  }, {});
};

const buildTrustBullets = ({
  product,
  usage,
  weights,
  budgetFit,
  advancedFit,
  matchTier
}) => {
  const bullets = [];
  const strengths = getTopStrengths(product);

  bullets.push(`${matchTier} for your selected priorities`);

  if (weights.gaming >= 70 && product.gamingScore >= 75) {
    bullets.push(`Gaming score ${product.gamingScore}/100 with ${product.processor}`);
  }

  if (weights.camera >= 70 && product.cameraScore >= 75) {
    bullets.push(`Camera profile scores ${product.cameraScore}/100`);
  }

  if (weights.battery >= 70 && product.batteryScore >= 75) {
    bullets.push(`${product.battery}mAh battery with ${product.batteryScore}/100 endurance score`);
  }

  if (weights.display >= 70 && product.displayScore >= 75) {
    bullets.push(`${product.refreshRate || 60}Hz display tuned for smooth visual use`);
  }

  if (product.processorTier === "flagship" && ["gamer", "creator", "power_user"].includes(usage)) {
    bullets.push(`Flagship silicon tier: ${product.processor}`);
  }

  if (budgetFit.label && !budgetFit.label.startsWith("No budget")) {
    bullets.push(budgetFit.label);
  }

  if (advancedFit.misses.length) {
    bullets.push(`Tradeoff: ${advancedFit.misses[0]}`);
  }

  strengths.forEach((strength) => {
    if (bullets.length < 5) {
      bullets.push(strength);
    }
  });

  return [...new Set(bullets)].slice(0, 4);
};

router.post("/", async (req, res) => {
  try {
    const {
      usage = "gamer",
      weights = {},
      advanced = {},
      budget
    } = req.body;

    const currentWeights = {
      ...(profileDefaults[usage] || profileDefaults.gamer),
      ...weights
    };

    const maxBudget = Number(budget || 0);
    const products = await Product.find({});
    const variantMeta = buildVariantMeta(products);

    const recommendations = products.map((productDocument) => {
      const product = productDocument.toObject();

      let weightedScore = 0;
      let totalWeight = 0;

      scoreFields.forEach(([weightKey, scoreKey]) => {
        const weight = Number(currentWeights[weightKey] || 0);
        const score = Number(product[scoreKey] || 50);

        if (weight > 0) {
          weightedScore += weight * score;
          totalWeight += weight;
        }
      });

      const priorityScore =
        totalWeight > 0 ? weightedScore / totalWeight : 70;

      const budgetFit = calculateBudgetFit(product.price, maxBudget);
      const advancedFit = calculateAdvancedFit(product, advanced);
      const idealForText = (product.idealFor || [])
        .join(" ")
        .toLowerCase();
      const intentBoost = (intentLabels[usage] || [])
        .some((label) => idealForText.includes(label))
        ? 4
        : 0;
      const stockBoost = product.stock > 0 ? 2 : -12;

      const finalScore = clamp(
        priorityScore * 0.68 +
        budgetFit.score * 0.18 +
        advancedFit.score * 0.14 +
        intentBoost +
        stockBoost -
        budgetFit.penalty
      );

      const matchTier = getMatchTier(finalScore);
      const cleanBaseName = cleanProductName(product.name);
      const variantKey = `${product.brand}|${product.category}|${cleanBaseName}`;
      const modelVariants = variantMeta[variantKey] || {
        count: 1,
        minPrice: product.price,
        storages: new Set([product.storage]),
        ramOptions: new Set([product.ram])
      };
      const storageOptions = [...modelVariants.storages].sort((a, b) => a - b);
      const ramOptions = [...modelVariants.ramOptions].sort((a, b) => a - b);
      const storageLabel = storageOptions.length > 1
        ? `${formatStorage(storageOptions[0])}-${formatStorage(storageOptions[storageOptions.length - 1])} storage`
        : `${formatStorage(product.storage)} storage`;

      return {
        ...product,
        cleanBaseName,
        matchPercentage: finalScore,
        matchTier,
        trustBullets: buildTrustBullets({
          product,
          usage,
          weights: currentWeights,
          budgetFit,
          advancedFit,
          matchTier
        }),
        specHighlights: [
          ramOptions.length > 1
            ? `${ramOptions[0]}-${ramOptions[ramOptions.length - 1]}GB RAM`
            : `${product.ram}GB RAM`,
          storageLabel,
          product.processorTier,
          modelVariants.count > 1
            ? `${modelVariants.count} configurations`
            : `${product.battery}mAh`
        ],
        variantCount: modelVariants.count,
        fromPrice: modelVariants.minPrice,
        storageOptions,
        scoreBreakdown: {
          priority: clamp(priorityScore),
          budget: budgetFit.score,
          hardware: advancedFit.score
        }
      };
    });

    const uniqueMap = {};

    recommendations.forEach((item) => {
      const existing = uniqueMap[item.cleanBaseName];

      if (!existing) {
        uniqueMap[item.cleanBaseName] = item;
        return;
      }

      if (
        item.matchPercentage > existing.matchPercentage ||
        (
          item.matchPercentage === existing.matchPercentage &&
          item.price < existing.price
        )
      ) {
        uniqueMap[item.cleanBaseName] = item;
      }
    });

    const finalRecommendations = Object.values(uniqueMap)
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }

        return a.price - b.price;
      })
      .slice(0, 12);

    res.status(200).json(finalRecommendations);
  } catch (error) {
    console.error("Scoring Engine Error:", error);
    res.status(500).json({
      message: "Error compiling compatibility profiles",
      error: error.message
    });
  }
});

module.exports = router;
