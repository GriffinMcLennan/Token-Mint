const sleep = async (ms: number) => {
    return new Promise((r) => setTimeout(r, ms));
};

export default sleep;
