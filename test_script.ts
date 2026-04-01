import 'dotenv/config';
import { getExpertHomeDataAction } from './src/actions/expert.action';
async function run() {
  const result = await getExpertHomeDataAction(1);
  console.log("RESULT:", JSON.stringify(result, null, 2));
}
run();
