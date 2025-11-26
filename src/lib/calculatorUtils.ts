// Life expectancy data by gender and age (US CDC 2023 data)
export const lifeExpectancyData: Record<'male' | 'female', Record<number, number>> = {
  male: {
    25: 76.5, 30: 76.8, 35: 77.1, 40: 77.5, 45: 78.0, 50: 78.7,
    55: 79.6, 60: 80.8, 65: 82.3, 70: 84.2, 75: 86.5, 80: 89.2
  },
  female: {
    25: 81.2, 30: 81.4, 35: 81.7, 40: 82.0, 45: 82.5, 50: 83.1,
    55: 84.0, 60: 85.1, 65: 86.5, 70: 88.2, 75: 90.3, 80: 92.8
  }
};

export const getLifeExpectancy = (age: number, gender: 'male' | 'female'): { min: number; max: number; average: number } => {
  const data = lifeExpectancyData[gender];
  const ages = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  // Find closest age bracket
  let closestAge = ages[0];
  for (const a of ages) {
    if (Math.abs(a - age) < Math.abs(closestAge - age)) {
      closestAge = a;
    }
  }
  
  const average = data[closestAge];
  return {
    min: average - 3,
    max: average + 5,
    average
  };
};

export const calculateLifetimeEarnings = (
  currentAge: number,
  retirementAge: number,
  currentIncome: number,
  annualIncrease: number
): { totalEarnings: number; yearsRemaining: number; incomeAtRetirement: number } => {
  const yearsRemaining = retirementAge - currentAge;
  let totalEarnings = 0;
  let income = currentIncome;
  
  for (let i = 0; i < yearsRemaining; i++) {
    totalEarnings += income;
    income *= (1 + annualIncrease / 100);
  }
  
  return {
    totalEarnings,
    yearsRemaining,
    incomeAtRetirement: income / (1 + annualIncrease / 100) // Last year's income
  };
};

export const calculateInsuranceLongevity = (
  insuranceAmount: number,
  monthlyNeeds: number,
  inflationRate: number,
  returnRate: number,
  taxRate: number
): { yearsLasting: number; monthlyDepletion: number[]; shortfall: boolean } => {
  let balance = insuranceAmount * (1 - taxRate / 100);
  const netReturnRate = (returnRate - inflationRate) / 100 / 12;
  const monthlyDepletion: number[] = [];
  let months = 0;
  
  while (balance > 0 && months < 600) { // Max 50 years
    balance = balance * (1 + netReturnRate) - monthlyNeeds;
    monthlyDepletion.push(Math.max(0, balance));
    months++;
  }
  
  return {
    yearsLasting: months / 12,
    monthlyDepletion,
    shortfall: months < 240 // Less than 20 years is considered a shortfall
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getLifeExpectancyInsight = (remainingYears: number): string => {
  if (remainingYears > 50) {
    return "People consistently underestimate how long they'll live. Planning for longevity is crucial.";
  } else if (remainingYears > 30) {
    return "You likely have decades ahead. Most underestimate their lifespan by 10-15 years.";
  } else if (remainingYears > 15) {
    return "Longevity risk is real — outliving your money is more common than you think.";
  }
  return "Every year matters. Planning should account for the possibility of living longer than expected.";
};

export const getEarningsInsight = (totalEarnings: number, yearsRemaining: number): string => {
  if (totalEarnings > 5000000) {
    return "Your earning power is your greatest asset. If it stops, everything stops. Protection isn't optional.";
  } else if (totalEarnings > 2000000) {
    return `You'll earn over ${formatCurrency(totalEarnings)} — your most valuable asset isn't your job, it's your ability to earn.`;
  } else if (totalEarnings > 1000000) {
    return "Most people don't realize they're millionaires in earning potential. This number should be protected.";
  }
  return `In ${yearsRemaining} years, you'll earn ${formatCurrency(totalEarnings)}. That's worth protecting.`;
};

export const getInsuranceInsight = (yearsLasting: number): string => {
  if (yearsLasting < 10) {
    return "Critical Alert: Your coverage would only last a few years. Most families discover this too late.";
  } else if (yearsLasting < 20) {
    return "Your insurance would be depleted before your family's needs end. This is the coverage gap most don't see.";
  } else if (yearsLasting < 30) {
    return "Adequate short-term, but consider: Will your family's needs really end in 20 years?";
  }
  return "Strong coverage duration, but always account for inflation and unexpected expenses.";
};

export const getCommissionInsight = (annualIncome: number): string => {
  if (annualIncome > 150000) {
    return "Income is controlled by math — not motivation. You're proving it.";
  } else if (annualIncome > 75000) {
    return "Protection sold today becomes income tomorrow. Consistency compounds.";
  }
  return "Most agents dramatically underestimate their scaling potential. Small changes create exponential results.";
};

// ============================================
// CREDIT & DEBT CALCULATOR FUNCTIONS
// ============================================

/**
 * Calculate credit card payoff timeline
 */
export const calculateCreditCardPayoff = (
  balance: number,
  apr: number,
  minPaymentPercent: number,
  minPaymentFloor: number,
  extraPayment: number = 0
): {
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
} => {
  const monthlyRate = apr / 100 / 12;
  const minPayment = Math.max(balance * (minPaymentPercent / 100), minPaymentFloor);
  const payment = minPayment + extraPayment;

  if (payment <= balance * monthlyRate) {
    // Payment doesn't cover interest - infinite payoff
    return {
      monthsToPayoff: 999,
      totalInterest: balance * 10,
      totalPaid: balance * 11
    };
  }

  // Calculate months to payoff
  const monthsToPayoff = Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
  );

  const totalPaid = payment * monthsToPayoff;
  const totalInterest = totalPaid - balance;

  return {
    monthsToPayoff: Math.max(1, monthsToPayoff),
    totalInterest: Math.max(0, totalInterest),
    totalPaid
  };
};

/**
 * Calculate loan payoff timeline
 */
export const calculateLoanPayoff = (
  balance: number,
  apr: number,
  monthlyPayment: number
): {
  monthsRemaining: number;
  payoffDate: string;
  totalInterest: number;
} => {
  const monthlyRate = apr / 100 / 12;

  if (monthlyPayment <= balance * monthlyRate) {
    return {
      monthsRemaining: 999,
      payoffDate: "Never (payment too low)",
      totalInterest: balance * 10
    };
  }

  const monthsRemaining = Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
  );

  const totalPaid = monthlyPayment * monthsRemaining;
  const totalInterest = totalPaid - balance;

  // Calculate payoff date
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining);
  const formattedDate = payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    monthsRemaining: Math.max(1, monthsRemaining),
    payoffDate: formattedDate,
    totalInterest: Math.max(0, totalInterest)
  };
};

/**
 * Calculate loan payment (PMT formula)
 */
export const calculateLoanPayment = (
  amount: number,
  rate: number,
  termMonths: number
): {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
} => {
  const monthlyRate = rate / 100 / 12;

  if (monthlyRate === 0) {
    // No interest
    const monthlyPayment = amount / termMonths;
    return {
      monthlyPayment,
      totalCost: amount,
      totalInterest: 0
    };
  }

  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalCost = monthlyPayment * termMonths;
  const totalInterest = totalCost - amount;

  return {
    monthlyPayment,
    totalCost,
    totalInterest: Math.max(0, totalInterest)
  };
};

/**
 * Estimate remaining balance from payment info
 */
export const estimateRemainingBalance = (
  monthlyPayment: number,
  rate: number,
  monthsRemaining: number
): {
  balance: number;
  totalAlreadyPaid: number;
  remainingInterest: number;
} => {
  const monthlyRate = rate / 100 / 12;

  if (monthlyRate === 0) {
    const balance = monthlyPayment * monthsRemaining;
    return {
      balance,
      totalAlreadyPaid: 0,
      remainingInterest: 0
    };
  }

  // Present value of annuity formula
  const balance = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -monthsRemaining)) / monthlyRate);
  const totalToPay = monthlyPayment * monthsRemaining;
  const remainingInterest = totalToPay - balance;

  return {
    balance: Math.max(0, balance),
    totalAlreadyPaid: balance * 0.3, // Rough estimate
    remainingInterest: Math.max(0, remainingInterest)
  };
};

// ============================================
// DEBT INSIGHT GENERATORS
// ============================================

export const getCreditCardInsight = (
  monthsToPayoff: number,
  totalInterest: number,
  balance: number,
  extraPayment: number
): string => {
  const interestPercent = (totalInterest / balance) * 100;
  
  if (monthsToPayoff > 60) {
    return "Minimum payments are designed to keep you trapped — not debt-free. Every extra dollar attacks YEARS of interest.";
  }
  
  if (interestPercent > 50) {
    return `You'll pay ${interestPercent.toFixed(0)}% in interest alone. Interest is silent theft — but it's optional.`;
  }
  
  if (extraPayment > 0) {
    return "Every extra dollar you pay goes straight to destroying the principal — not lining the bank's pocket.";
  }
  
  return "Banks sell convenience — and collect slavery. The faster you pay, the more of YOUR money you keep.";
};

export const getLoanPayoffInsight = (totalInterest: number, originalBalance: number): string => {
  const interestPercent = (totalInterest / originalBalance) * 100;
  
  if (interestPercent > 40) {
    return `You're not paying for the loan. You're paying for TIME. ${interestPercent.toFixed(0)}% of your payments go to interest.`;
  }
  
  if (interestPercent > 25) {
    return "Most people underestimate their total interest by 30-50%. You're seeing the truth now.";
  }
  
  return "Extra payments reduce the future — not just the balance. Every dollar over the minimum cuts months off your sentence.";
};

export const getLoanPaymentInsight = (
  monthlyPayment: number,
  totalInterest: number,
  termMonths: number
): string => {
  if (termMonths > 72) {
    return "Longer loans equal smaller payments — and bigger losses. The term is the real enemy, not the rate.";
  }
  
  if (totalInterest > monthlyPayment * 12) {
    return "You'll pay more than a year's worth of payments in pure interest. Cheap payments are expensive freedom.";
  }
  
  return "The interest rate is not the enemy. The term is. Shorter terms mean less time for interest to compound against you.";
};

export const getBalanceInsight = (remainingBalance: number, monthsRemaining: number): string => {
  const yearsRemaining = monthsRemaining / 12;
  
  if (yearsRemaining > 4) {
    return "You don't just owe money — you owe FUTURE time. Every payment has two jobs: interest and escape.";
  }
  
  if (monthsRemaining < 24) {
    return "You're in the home stretch. The finish line is visible now. Stay consistent.";
  }
  
  return "Debt is rent on your own life. The sooner you're free, the sooner you control your future.";
};

// ============================================================================
// CASH FLOW CALCULATOR FUNCTIONS
// ============================================================================

// Historical CPI data (simplified - using annual average CPI)
const historicalCPI: Record<number, number> = {
  1950: 24.1, 1960: 29.6, 1970: 38.8, 1980: 82.4, 1990: 130.7,
  2000: 172.2, 2005: 195.3, 2010: 218.1, 2015: 237.0, 2020: 258.8,
  2021: 271.0, 2022: 292.7, 2023: 304.7, 2024: 310.0
};

// Interpolate CPI for missing years
function getCPI(year: number): number {
  if (historicalCPI[year]) return historicalCPI[year];
  
  // Find surrounding years
  const years = Object.keys(historicalCPI).map(Number).sort((a, b) => a - b);
  const lowerYear = years.reverse().find(y => y < year);
  const upperYear = years.find(y => y > year);
  
  if (!lowerYear || !upperYear) return historicalCPI[2024]; // Default to latest
  
  // Linear interpolation
  const lowerCPI = historicalCPI[lowerYear];
  const upperCPI = historicalCPI[upperYear];
  const ratio = (year - lowerYear) / (upperYear - lowerYear);
  
  return lowerCPI + (upperCPI - lowerCPI) * ratio;
}

// Debt vs Investing Calculator
export function calculateDebtVsInvest(
  debtRate: number,
  isDeductible: boolean,
  investReturn: number,
  isTaxable: boolean,
  taxBracket: number,
  monthlyFunds: number
): {
  recommendation: "debt" | "invest";
  debtEffectiveRate: number;
  investEffectiveReturn: number;
  wealthDifference10yr: number;
  breakEvenReturn: number;
} {
  // Calculate effective rates after tax
  const taxRate = taxBracket / 100;
  const debtEffectiveRate = isDeductible ? debtRate * (1 - taxRate) : debtRate;
  const investEffectiveReturn = isTaxable ? investReturn * (1 - taxRate) : investReturn;
  
  // Determine recommendation
  const recommendation = investEffectiveReturn > debtEffectiveRate ? "invest" : "debt";
  
  // Calculate 10-year wealth difference
  const months = 120;
  const monthlyDebtRate = debtEffectiveRate / 100 / 12;
  const monthlyInvestRate = investEffectiveReturn / 100 / 12;
  
  // Future value of monthly payments
  const debtScenario = monthlyFunds * (Math.pow(1 + monthlyDebtRate, months) - 1) / monthlyDebtRate;
  const investScenario = monthlyFunds * (Math.pow(1 + monthlyInvestRate, months) - 1) / monthlyInvestRate;
  
  const wealthDifference10yr = investScenario - debtScenario;
  
  // Break-even return needed to match debt payoff
  const breakEvenReturn = debtEffectiveRate;
  
  return {
    recommendation,
    debtEffectiveRate,
    investEffectiveReturn,
    wealthDifference10yr,
    breakEvenReturn
  };
}

// Inflation Retirement Impact Calculator
export function calculateInflationRetirement(
  currentAge: number,
  grossIncome: number,
  retirementAge: number,
  lifeExpectancy: number,
  replacementPercent: number,
  inflationRate: number
): {
  requiredIncomeAtRetirement: number;
  totalRetirementNeeded: number;
  inflationGap: number;
  costOfWaitingOneYear: number;
  yearsToRetirement: number;
} {
  const yearsToRetirement = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;
  
  // Calculate required income at retirement (adjusted for inflation)
  const desiredIncome = grossIncome * (replacementPercent / 100);
  const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const requiredIncomeAtRetirement = desiredIncome * inflationMultiplier;
  
  // Total retirement capital needed (simplified - assumes level income need)
  const totalRetirementNeeded = requiredIncomeAtRetirement * retirementYears;
  
  // Inflation gap (difference between today's dollars and future need)
  const inflationGap = requiredIncomeAtRetirement - desiredIncome;
  
  // Cost of waiting one year (compound effect)
  const nextYearNeed = desiredIncome * Math.pow(1 + inflationRate / 100, yearsToRetirement + 1);
  const costOfWaitingOneYear = (nextYearNeed - requiredIncomeAtRetirement) * retirementYears;
  
  return {
    requiredIncomeAtRetirement,
    totalRetirementNeeded,
    inflationGap,
    costOfWaitingOneYear,
    yearsToRetirement
  };
}

// Purchasing Power Calculator
export function calculatePurchasingPower(
  amount: number,
  startYear: number,
  endYear: number
): {
  adjustedValue: number;
  purchasingPowerLoss: number;
  lossPercent: number;
  inflationMultiple: number;
} {
  const startCPI = getCPI(startYear);
  const endCPI = getCPI(endYear);
  
  // Calculate adjusted value (what the amount from startYear equals in endYear)
  const adjustedValue = amount * (endCPI / startCPI);
  
  // Calculate loss
  const purchasingPowerLoss = adjustedValue - amount;
  const lossPercent = (purchasingPowerLoss / adjustedValue) * 100;
  
  // Inflation multiple
  const inflationMultiple = endCPI / startCPI;
  
  return {
    adjustedValue,
    purchasingPowerLoss,
    lossPercent,
    inflationMultiple
  };
}

// Insight Generators for Cash Flow Calculators
export function getDebtVsInvestInsight(recommendation: "debt" | "invest", wealthDiff: number): string {
  if (recommendation === "debt") {
    return `A guaranteed return beats a hypothetical return. Paying down debt saves you ${formatCurrency(Math.abs(wealthDiff))} over 10 years compared to investing. Freedom has a math formula — and it says eliminate the certain cost first.`;
  } else {
    return `Your investment potential exceeds your debt cost by ${formatCurrency(Math.abs(wealthDiff))} over 10 years. While debt payoff feels safe, the math says your capital works harder in the market. What feels smart is often financially suboptimal.`;
  }
}

export function getInflationRetirementInsight(inflationGap: number, yearsToRetirement: number): string {
  if (yearsToRetirement > 25) {
    return `Inflation quietly cuts your future in half. Over ${yearsToRetirement} years, your income needs will increase by ${formatCurrency(inflationGap)}. If your money doesn't grow faster than inflation, it shrinks — and so does your retirement dream.`;
  } else if (yearsToRetirement > 15) {
    return `Today's lifestyle becomes tomorrow's shock. Your retirement is ${yearsToRetirement} years away, but inflation never sleeps. The gap between today's income and what you'll need is ${formatCurrency(inflationGap)} — and growing every year.`;
  } else {
    return `Time is running out to outpace inflation. With only ${yearsToRetirement} years until retirement, you need ${formatCurrency(inflationGap)} more than today's dollars just to maintain your lifestyle. Every year of delay compounds the damage.`;
  }
}

export function getPurchasingPowerInsight(lossPercent: number, yearsSpan: number): string {
  if (lossPercent > 60) {
    return `Time is a thief. Inflation is its partner. Over ${yearsSpan} years, your money lost ${lossPercent.toFixed(0)}% of its purchasing power. What used to buy a house now buys a car. Your savings are melting — invisibly but relentlessly.`;
  } else if (lossPercent > 30) {
    return `In ${yearsSpan} years, inflation ate ${lossPercent.toFixed(0)}% of your money's value. That's not theoretical — that's the real cost of holding cash. Money sitting still is actually moving backward.`;
  } else {
    return `Even "low" inflation compounds brutally. Over ${yearsSpan} years, ${lossPercent.toFixed(0)}% of purchasing power vanished. The dollar in your pocket today is worth less every single day — and tomorrow won't be any different.`;
  }
}

// ============================================================================
// RETIREMENT CALCULATORS
// ============================================================================

export const calculateSocialSecurity = (
  yourIncome: number,
  yourAge: number,
  yourRetirementAge: number,
  spouseIncome: number,
  spouseAge: number,
  spouseRetirementAge: number,
  inflationRate: number
) => {
  // Simplified Social Security benefit estimation
  // Based on AIME (Average Indexed Monthly Earnings) bend points
  
  const calculateBenefit = (income: number, age: number, retirementAge: number) => {
    const monthlyIncome = income / 12;
    const aime = monthlyIncome * 0.9; // Simplified AIME calculation
    
    // 2024 bend points (simplified)
    let benefit = 0;
    if (aime <= 1115) {
      benefit = aime * 0.90;
    } else if (aime <= 6721) {
      benefit = 1115 * 0.90 + (aime - 1115) * 0.32;
    } else {
      benefit = 1115 * 0.90 + (6721 - 1115) * 0.32 + (aime - 6721) * 0.15;
    }
    
    // Adjust for claiming age (simplified)
    const fra = 67; // Full Retirement Age
    if (retirementAge < fra) {
      const monthsEarly = (fra - retirementAge) * 12;
      benefit *= (1 - monthsEarly * 0.00556); // ~6.67% per year reduction
    } else if (retirementAge > fra) {
      const monthsLate = (retirementAge - fra) * 12;
      benefit *= (1 + monthsLate * 0.00667); // 8% per year increase
    }
    
    return benefit;
  };
  
  const yourBenefit = calculateBenefit(yourIncome, yourAge, yourRetirementAge);
  const spouseBenefit = calculateBenefit(spouseIncome, spouseAge, spouseRetirementAge);
  const combinedBenefit = yourBenefit + spouseBenefit;
  
  // Calculate inflation-adjusted value
  const yourYearsToRetirement = yourRetirementAge - yourAge;
  const inflationMultiplier = Math.pow(1 + inflationRate / 100, yourYearsToRetirement);
  const inflationAdjustedValue = combinedBenefit / inflationMultiplier;
  
  // Calculate replacement percentage
  const combinedIncome = yourIncome + spouseIncome;
  const replacementPercentage = (combinedBenefit * 12 / combinedIncome) * 100;
  
  return {
    yourBenefit,
    spouseBenefit,
    combinedBenefit,
    inflationAdjustedValue,
    replacementPercentage
  };
};

export const getSocialSecurityInsight = (result: ReturnType<typeof calculateSocialSecurity>): string => {
  const { replacementPercentage, inflationAdjustedValue, combinedBenefit } = result;
  
  if (replacementPercentage < 40) {
    return `Social Security replaces only ${replacementPercentage.toFixed(0)}% of your income. It's a cushion—not a plan. Most families rely on more than they should… and save less than they should. Without additional income, retirement becomes survival mode.`;
  } else if (replacementPercentage < 60) {
    return `Your Social Security covers ${replacementPercentage.toFixed(0)}% of income needs. That leaves a ${(100 - replacementPercentage).toFixed(0)}% gap to fill. Longevity creates the real risk—not retirement. Living longer than your money is the hidden crisis.`;
  } else {
    return `Social Security provides ${replacementPercentage.toFixed(0)}% replacement. But inflation turns ${formatCurrency(combinedBenefit)} into ${formatCurrency(inflationAdjustedValue)} in today's dollars. Time erodes guarantees. Planning preserves them.`;
  }
};

export const calculateInflationDamage = (
  currentAge: number,
  annualIncome: number,
  inflationRate: number,
  retirementAge: number,
  lifeExpectancy: number,
  replacementPercent: number
) => {
  const yearsToRetirement = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;
  
  // Calculate required income at retirement
  const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const requiredIncomeAtRetirement = (annualIncome * (replacementPercent / 100)) * inflationMultiplier;
  
  // Current income replacement target
  const currentIncomeTarget = annualIncome * (replacementPercent / 100);
  
  // Inflation gap
  const inflationGap = requiredIncomeAtRetirement - currentIncomeTarget;
  
  // Cost of delaying one year (compounding effect)
  const oneYearLaterMultiplier = Math.pow(1 + inflationRate / 100, yearsToRetirement - 1);
  const costOfDelayOneYear = (requiredIncomeAtRetirement - (currentIncomeTarget * oneYearLaterMultiplier)) * retirementYears;
  
  // Purchasing power loss percentage
  const purchasingPowerLoss = ((1 - (1 / inflationMultiplier)) * 100);
  
  // Generate purchasing power data for chart
  const purchasingPowerData = [];
  for (let i = 0; i <= yearsToRetirement; i += Math.max(1, Math.floor(yearsToRetirement / 10))) {
    const year = currentAge + i;
    const value = currentIncomeTarget / Math.pow(1 + inflationRate / 100, i);
    purchasingPowerData.push({ year, value });
  }
  
  return {
    requiredIncomeAtRetirement,
    inflationGap,
    costOfDelayOneYear,
    purchasingPowerLoss,
    yearsToRetirement,
    purchasingPowerData
  };
};

export const getInflationDamageInsight = (result: ReturnType<typeof calculateInflationDamage>): string => {
  const { inflationGap, yearsToRetirement, purchasingPowerLoss } = result;
  
  if (purchasingPowerLoss > 60) {
    return `Inflation will destroy ${purchasingPowerLoss.toFixed(0)}% of your purchasing power over ${yearsToRetirement} years. Time makes wealth—but it also destroys unprotected income. If your retirement doesn't grow… it dies quietly.`;
  } else if (purchasingPowerLoss > 40) {
    return `You'll need an extra ${formatCurrency(inflationGap)}/year just to maintain today's lifestyle. Inflation is the slow leak in your future. Most people plan for retirement. Few plan for inflation's compound damage.`;
  } else {
    return `Even with "moderate" inflation, your income needs increase by ${formatCurrency(inflationGap)}/year. Today's lifestyle becomes tomorrow's shock. Protection isn't optional—it's mathematical.`;
  }
};

export const calculateHabitsToWealth = (
  oneTimeExpense: number,
  recurringExpense: number,
  frequency: number,
  yearsToRetirement: number,
  expectedReturn: number,
  taxBracket: number
) => {
  const monthlySpending = recurringExpense * frequency;
  const annualSpending = monthlySpending * 12;
  const totalSpent = oneTimeExpense + (annualSpending * yearsToRetirement);
  
  // Calculate future value if invested instead
  const afterTaxReturn = expectedReturn * (1 - taxBracket / 100);
  const monthlyRate = afterTaxReturn / 100 / 12;
  const months = yearsToRetirement * 12;
  
  // Future value of recurring investments
  let futureValueRecurring = 0;
  if (monthlyRate > 0) {
    futureValueRecurring = monthlySpending * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  } else {
    futureValueRecurring = monthlySpending * months;
  }
  
  // Future value of one-time investment
  const futureValueOneTime = oneTimeExpense * Math.pow(1 + afterTaxReturn / 100, yearsToRetirement);
  
  const futureValue = futureValueRecurring + futureValueOneTime;
  const totalOpportunityCost = futureValue - totalSpent;
  const wealthMultiplier = futureValue / totalSpent;
  
  return {
    totalSpent,
    futureValue,
    totalOpportunityCost,
    wealthMultiplier,
    monthlySpending
  };
};

export const getHabitsWealthInsight = (result: ReturnType<typeof calculateHabitsToWealth>): string => {
  const { totalOpportunityCost, wealthMultiplier, monthlySpending } = result;
  
  if (wealthMultiplier > 4) {
    return `Small habits build massive futures. Your ${formatCurrency(monthlySpending)}/month habit costs you ${formatCurrency(totalOpportunityCost)} in future wealth. What you cut today feeds you tomorrow. Lifestyle is financial programming.`;
  } else if (wealthMultiplier > 2) {
    return `Every dollar not spent becomes ${wealthMultiplier.toFixed(1)} dollars in retirement. That's ${formatCurrency(totalOpportunityCost)} in opportunity cost. Freedom isn't about sacrifice—it's about strategy.`;
  } else {
    return `This habit represents ${formatCurrency(totalOpportunityCost)} in lost retirement wealth. Small daily decisions compound into life-changing outcomes. The question isn't "Can I afford this?"—it's "What does this really cost?"`;
  }
};