import { Connection } from "@solana/web3.js";
import sleep from "./sleep";

const WAITING = 0;
const PROCESSING = 1;
const COMPLETE = 2;

const handleTransaction = async (
    connection: Connection,
    signature: string,
    lastValidBlockHeight: number,
    updateState: (val: number) => void
) => {
    updateState(PROCESSING);

    let status = await connection.getSignatureStatus(signature);
    let blockHeight = await connection.getBlockHeight();

    while (status.value === null && blockHeight <= lastValidBlockHeight) {
        await sleep(500);
        status = await connection.getSignatureStatus(signature);
        blockHeight = await connection.getBlockHeight();
    }

    if (status.value === null) {
        throw new Error("Failed to confirm transaction");
    }

    updateState(COMPLETE);
};

export default handleTransaction;
export { PROCESSING, COMPLETE, WAITING };
