import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();
const conversationHistory = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function chat(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8096,
    system: `You are a financial advisor AI specializing in compound interest calculations for long-term investments. 
    
Your capabilities include:
1. Calculating compound interest using the formula: A = P(1 + r/n)^(nt)
   Where:
   - P = Principal amount
   - r = Annual interest rate (as decimal)
   - n = Number of times interest is compounded per year
   - t = Time in years
   - A = Final amount

2. Providing investment recommendations
3. Explaining how compound interest works
4. Analyzing different investment scenarios
5. Calculating time to reach financial goals
6. Comparing different investment options

Always provide clear mathematical breakdowns and practical advice. When users ask for calculations, show your work step by step.`,
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}

function calculateCompoundInterest(principal, rate, compounds, years) {
  const amount = principal * Math.pow(1 + rate / compounds, compounds * years);
  const interest = amount - principal;
  return {
    principal: principal.toFixed(2),
    finalAmount: amount.toFixed(2),
    totalInterest: interest.toFixed(2),
    rate: (rate * 100).toFixed(2),
    compounds: compounds,
    years: years,
  };
}

async function runCalculator() {
  console.log("=".repeat(60));
  console.log("COMPOUND INTEREST CALCULATOR FOR LONG-TERM INVESTMENTS");
  console.log("=".repeat(60));
  console.log(
    "\nWelcome! I'm your AI financial advisor. I can help you calculate compound interest"
  );
  console.log(
    "and plan your long-term investments. You can ask me questions naturally."
  );
  console.log("\nExample questions:");
  console.log("- How much will $10,000 grow in 20 years at 7% annual interest?");
  console.log("- Compare monthly vs. annual compounding for my investment");
  console.log("- How long will it take to reach $100,000 if I invest $5,000?");
  console.log("\nType 'calculate' to use the direct calculator");
  console.log("Type 'quit' to exit\n");

  while (true) {
    const userInput = await prompt("You: ");

    if (userInput.toLowerCase() === "quit") {
      console.log(
        "\nThank you for using the Compound Interest Calculator. Goodbye!"
      );
      rl.close();
      break;
    }

    if (userInput.toLowerCase() === "calculate") {
      console.log("\n--- Direct Calculation Mode ---");
      try {
        const principal = parseFloat(await prompt("Principal amount ($): "));
        const rate = parseFloat(
          await prompt("Annual interest rate (% e.g., 7 for 7%): ")
        );
        const compounds = parseInt(
          await prompt(
            "Compounding frequency (1=annually, 2=semi-annually, 4=quarterly, 12=monthly): "
          )
        );
        const years = parseInt(await prompt("Investment period (years): "));

        const result = calculateCompoundInterest(
          principal,
          rate / 100,
          compounds,
          years
        );

        console.log("\n--- Calculation Results ---");
        console.log(`Principal: $${result.principal}`);
        console.log(`Annual Interest Rate: ${result.rate}%`);
        console.log(`Compounding: ${result.compounds} times per year`);
        console.log(`Time Period: ${result.years} years`);
        console.log(`Final Amount: $${result.finalAmount}`);
        console.log(`Total Interest Earned: $${result.totalInterest}`);
        console.log(`Return on Investment: ${((parseFloat(result.totalInterest) / parseFloat(result.principal)) * 100).toFixed(2)}%\n`);

        const explanation = await chat(
          `I calculated a compound interest scenario with the following results: Principal: $${result.principal}, Final Amount: $${result.finalAmount}, Interest Earned: $${result.totalInterest} over ${result.years} years at ${result.rate}% annual rate with ${result.compounds}x yearly compounding. Can you provide some insights about this investment?`
        );
        console.log(`Assistant: ${explanation}\n`);
      } catch (error) {
        console.log(
          "Invalid input. Please enter valid numbers.\n"
        );
      }
      continue;
    }

    if (userInput.trim().length === 0) {
      continue;
    }

    try {
      const response = await chat(userInput);
      console.log(`\nAssistant: ${response}\n`);
    } catch (error) {
      console.log("Error communicating with AI. Please try again.\n");
    }
  }
}

runCalculator().catch(console.error);