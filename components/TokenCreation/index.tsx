import { Button, Flex, Text, Spinner, useToast, Link, Input } from "@chakra-ui/react";
import {
    ACCOUNT_SIZE,
    createInitializeAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    getMinimumBalanceForRentExemptAccount,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, Transaction } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import { useState } from "react";
import handleTransaction, { PROCESSING, COMPLETE, WAITING } from "../../utils/handleTransaction";
import generatePrefixKey from "../../utils/generatePrefixKey";

const TokenCreation = () => {
    const { publicKey, sendTransaction, wallet } = useWallet();
    const { connection } = useConnection();
    const toast = useToast();
    const [transactionStatus, setTransactionStatus] = useState(WAITING);
    const [mintKeypair, setMintKeypair] = useState(Keypair.generate());
    const [prefix, setPrefix] = useState("");
    const [decimals, setDecimals] = useState(0);
    const [mintAmount, setMintAmount] = useState(0);
    const [freezeAuthority, setFreezeAuthority] = useState("");

    const createAndMintToken = async () => {
        if (!publicKey || !wallet) return;
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        const walletLamports = await getMinimumBalanceForRentExemptAccount(connection);

        const transaction = new Transaction();

        transaction.add(
            web3.SystemProgram.createAccount({
                fromPubkey: publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                lamports,
                programId: TOKEN_PROGRAM_ID,
                space: MINT_SIZE,
            })
        );

        let freezeAuthorityKey = null;

        if (freezeAuthority.length === 44) {
            try {
                freezeAuthorityKey = new web3.PublicKey(freezeAuthority);
            } catch (e: any) {
                toast({
                    status: "error",
                    description: "Invalid freeze authority key",
                });
                return;
            }
        }

        const initMintInstruction = createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            publicKey,
            freezeAuthorityKey
        );

        transaction.add(initMintInstruction);

        const tokenWalletKeypair = Keypair.generate();

        const createTokenWallet = web3.SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: tokenWalletKeypair.publicKey,
            space: ACCOUNT_SIZE,
            lamports: walletLamports,
            programId: TOKEN_PROGRAM_ID,
        });

        const initTokenWallet = createInitializeAccountInstruction(
            tokenWalletKeypair.publicKey,
            mintKeypair.publicKey,
            publicKey
        );

        const mintInstruction = createMintToInstruction(
            mintKeypair.publicKey,
            tokenWalletKeypair.publicKey,
            publicKey,
            mintAmount * Math.pow(10, decimals)
        );

        transaction.add(createTokenWallet);
        transaction.add(initTokenWallet);
        transaction.add(mintInstruction);

        const blockhash = await connection.getLatestBlockhashAndContext();

        try {
            const sig = await sendTransaction(transaction, connection, {
                signers: [mintKeypair, tokenWalletKeypair],
                preflightCommitment: "confirmed",
            });

            const lastValidBlockHeight = blockhash.context.slot + 150;
            await handleTransaction(connection, sig, lastValidBlockHeight, setTransactionStatus);

            toast({
                duration: 5000,
                status: "success",
                title: "Successfully confirmed the transaction",
                description: (
                    <Link isExternal href={`https://solscan.io/tx/${sig}?cluster=devnet`}>
                        Click here to view the transaction
                    </Link>
                ),
            });
        } catch (e: any) {
            console.log(e);

            const errorMsg = e.message !== undefined ? e.message : "The transaction has failed to be confirmed";

            toast({
                duration: 5000,
                status: "error",
                description: errorMsg,
            });
            setTransactionStatus(COMPLETE);
        }
    };

    return (
        <Flex width="100%" alignItems="center" flexDirection="column">
            <Text fontSize="22px" fontWeight="600" mb="30px">
                Streamflow Token Mint:
            </Text>

            <Flex mb="10px">
                <Input
                    width="200px"
                    placeholder="Prefix (1 char max)"
                    maxLength={1}
                    onChange={(e) => setPrefix(e.target.value)}
                />
                <Button
                    width="200px"
                    ml="20px"
                    onClick={() => {
                        setTransactionStatus(WAITING);
                        setMintKeypair(generatePrefixKey(prefix));
                    }}
                >
                    Generate new key
                </Button>
            </Flex>

            <Flex alignItems="center" width="420px" mb="10px">
                <Text width="85px">Mint Key:</Text>
                <Input width="85%" disabled value={mintKeypair.publicKey.toBase58()} />
            </Flex>

            <Flex alignItems="center" width="420px" mb="10px">
                <Text width="85px">Decimals: </Text>
                <Input
                    width="85%"
                    maxLength={1}
                    defaultValue={9}
                    placeholder={"9"}
                    onChange={(e) => setDecimals(Number(e.target.value))}
                />
            </Flex>

            <Flex alignItems="center" width="420px" mb="10px">
                <Text width="200px">Amount To Mint:</Text>
                <Input
                    width="100%"
                    defaultValue={0}
                    placeholder={"0"}
                    value={mintAmount}
                    onChange={(e) => setMintAmount(Number(e.target.value))}
                />
            </Flex>

            <Flex alignItems="center" width="420px" mb="10px">
                <Text width="200px">Freeze Authority:</Text>
                <Input
                    width="100%"
                    defaultValue={""}
                    maxLength={44}
                    onChange={(e) => setFreezeAuthority(e.target.value)}
                />
            </Flex>

            <Button
                width="200px"
                disabled={transactionStatus === PROCESSING || transactionStatus === COMPLETE}
                onClick={createAndMintToken}
            >
                Create Token {transactionStatus === PROCESSING && <Spinner ml="20px" />}
            </Button>
        </Flex>
    );
};

export default TokenCreation;
