import { Flex } from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import TokenCreation from "../components/TokenCreation";

const Home: NextPage = () => {
    return (
        <Flex width="100%">
            <Head>
                <title>Streamflow</title>
                <meta name="description" content="Streamline creating a Solana Token" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <TokenCreation />
        </Flex>
    );
};

export default Home;
