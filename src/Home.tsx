import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import * as anchor from "@project-serum/anchor";
import holderToken from './TokenAddress.json'
import {
    Commitment,
    Connection,
    PublicKey,
    Transaction,
    LAMPORTS_PER_SOL,
    Keypair
} from "@solana/web3.js";
import {
    getParsedNftAccountsByOwner
} from "@nfteyez/sol-rayz";
import Asset from './assets';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Snackbar, Chip, Container, Checkbox, Input } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { AlertState } from './utils';

import NFT from "./component/NFT";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { sendTransaction, sendTransactions } from "./connection";
import bs58 from "bs58";

const cluster_rpc = process.env.REACT_APP_CLUSTER_RPC!;
const collection_name = process.env.REACT_APP_COLLECTION_NAME;
const reward_token = process.env.REACT_APP_REWARD_TOKEN;
const source_wallet = process.env.REACT_APP_SOURCE;
const DECIMAL = Number(process.env.REACT_APP_DECIMAL!);

const connection = new anchor.web3.Connection(
    cluster_rpc
);

export interface HomeProps {
    candyMachineId?: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
    network: WalletAdapterNetwork;
}

const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState(0);
    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const [isEnable, setEnable] = useState(false);
    const [nftList, setNftList] = useState<any[]>();
    const [selectList, setSelectList] = useState<any[]>([]);

    const wallet = useWallet();

    const anchorWallet = useMemo(() => {
        if (
            !wallet ||
            !wallet.publicKey ||
            !wallet.signAllTransactions ||
            !wallet.signTransaction
        ) {
            return;
        }

        return {
            publicKey: wallet.publicKey,
            signAllTransactions: wallet.signAllTransactions,
            signTransaction: wallet.signTransaction,
        } as anchor.Wallet;
    }, [wallet]);

    useEffect(() => {
        let flag = false;
        (async () => {
            if (anchorWallet) {
                // const balance = await props.connection.getBalance(anchorWallet!.publicKey);
                const balance = await connection.getBalance(anchorWallet!.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);

                const pubkey = anchorWallet.publicKey.toString();
                const tokenList = await getParsedNftAccountsByOwner({
                    publicAddress: pubkey,
                    connection: connection
                });

                console.log(`tokenList::`, tokenList);

                tokenList.forEach(item => {
                    for (let i = 0; i < holderToken.length; i++) {
                        if (item.mint == holderToken[i]) {
                            flag = true;
                        }
                    }
                })

                flag = 1 == 1;

                if (flag == false) {
                    setEnable(false);
                    setAlertState({
                        open: true,
                        severity: 'info',
                        message: "You are not our holder!!"
                    })
                    return;
                } else {

                    let token_list: any[] = [];
                    tokenList.forEach(item => {
                        if (item.data.symbol == collection_name) {
                            token_list.push(item);
                        }
                    })

                    console.log(`token_list::`, token_list);

                    let imageList: any[] = [];
                    imageList = await Promise.all(
                        token_list.map(async (item) =>
                            fetch(item.data.uri)
                                .then(res => res.json())
                                .catch(() => null)
                        )
                    )

                    console.log(`imageResult::`, imageList);

                    let nft_list: any[] = [];
                    token_list.forEach((item, idx) => {
                        nft_list.push({
                            ...item,
                            imageUrl: imageList[idx] ? imageList[idx].image : null
                        })
                    })

                    setNftList(nft_list);

                }
            }
        })();
    }, [anchorWallet, props.connection]);

    const nftClick = (addr: any) => {
        let flag = -1;
        let list = selectList;
        for (let i = 0; i < list.length; i++) {
            if (list[i] == addr) {
                flag = i;
            }
        }
        if (flag != -1) {
            list.splice(flag, 1);
        } else {
            list.push(addr);
        }
        console.log(`selected list::`, list);
        setSelectList(list);
    }

    const burn = async () => {
        if (!wallet.publicKey) {
            return;
        }
        let burnTokenList: any[] = [];

        let tokenAccountList: any[] = [];
        let tokenAccountListRes: any[] = [];
        selectList.forEach(item => {
            let signer = new Keypair();
            let token = new Token(
                connection,
                new PublicKey(item),
                TOKEN_PROGRAM_ID,
                signer
            );
            burnTokenList.push({
                token: token,
                mint: item
            });
            tokenAccountList.push(
                token.getOrCreateAssociatedAccountInfo(
                    wallet.publicKey!
                )
            )
        })

        tokenAccountListRes = await Promise.all(tokenAccountList);
        const signerMatrix: any[] = [];
        const instructionMatrix: any[] = [];

        selectList.forEach((item, key) => {
            const signerKey = anchor.web3.Keypair.generate();
            const signers = [signerKey];
            console.log(`signer:::`, signerKey.publicKey.toBase58());
            let instructions: any[] = [];
            instructions.push(
                Token.createBurnInstruction(
                    TOKEN_PROGRAM_ID,
                    new PublicKey(burnTokenList[key].mint),
                    tokenAccountListRes[key].address,
                    wallet.publicKey!,
                    [],
                    1
                )
            )
            signerMatrix.push(signers);
            instructionMatrix.push(instructions);
        })

        try {

            await sendTransactions(
                connection,
                anchorWallet,
                instructionMatrix,
                signerMatrix
            )

            let amount = Math.floor(selectList.length / 3);
            let instruction1 = [];
            let sourceArray = bs58.decode(source_wallet!);
            let sourceWallet = Keypair.fromSecretKey(sourceArray);
            console.log(`sourcewallet::`, sourceWallet);
            const newToken = new Token(
                connection,
                new PublicKey(reward_token!),
                TOKEN_PROGRAM_ID,
                sourceWallet
            )

            const tokenAccount = await newToken.getOrCreateAssociatedAccountInfo(
                sourceWallet.publicKey
            );

            const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
                newToken.associatedProgramId,
                newToken.programId,
                new PublicKey(reward_token!),
                wallet?.publicKey
            )

            let receiverAccount = connection.getAccountInfo(associatedDestinationTokenAddr);
            if (receiverAccount == null) {
                instruction1.push(
                    Token.createAssociatedTokenAccountInstruction(
                        newToken.associatedProgramId,
                        newToken.programId,
                        new PublicKey(reward_token!),
                        associatedDestinationTokenAddr,
                        wallet.publicKey,
                        sourceWallet.publicKey
                    )
                )
            }
            instruction1.push(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    tokenAccount.address,
                    associatedDestinationTokenAddr,
                    sourceWallet.publicKey,
                    [],
                    amount * DECIMAL
                )
            )
            const transaction1 = new Transaction().add(
                ...instruction1
            );
            var signature1 = await anchor.web3.sendAndConfirmTransaction(
                connection,
                transaction1,
                [sourceWallet]
            )

            setAlertState({
                open: true,
                message: "Burn Token Successfully",
                severity: "success",
            })

            setTimeout(() => {
                document.location.reload();
            }, 3000)

        } catch (err) {
            console.log(`err::`, err);
            setAlertState({
                open: true,
                message: "Burn Token Failed",
                severity: "error",
            })
        }
    }

    return (
        <main>
            <div className="container">
                <div className="header">
                    <img src={Asset.home} alt="home"></img>
                    <WalletMultiButton />
                </div>
                <div className="main">
                    <div className="logo-part">
                        <img src={Asset.smallLogo}></img>
                        <span className="f-28">NEST</span>
                        <span className="f-24">LIMITED</span>
                        <span className="f-18 mt-2">TURN YOUR NFTS TO WHITELIST TOKENS</span>
                    </div>

                    <div className="section mt-2">
                        <div className="col f-center">
                            <div className="f-32">MY NFTS</div>
                            <span className="f-10 mt-1">MUST BURN 3 NFTS FOR 1 WL TOKEN</span>
                        </div>
                        <div className="nft-part">
                            {
                                nftList?.map((item, idx) => (
                                    <NFT imgSrc={item.imageUrl} myclick={() => nftClick(item.mint)} key={idx}></NFT>
                                ))
                            }
                            {
                                nftList?.length == 0 &&
                                <span className="f-18 mt-3 mb-3">NO ELIGIBLE NFTS TO BURN</span>
                            }
                        </div>
                        <button className="burn-btn" onClick={() => { burn(); }}>BURN FOR (1) WL TOKEN</button>
                    </div>

                </div>
            </div>
            <div className="footer">
                <img src={Asset.smallLogo}></img>
                <span>NEST 2022</span>
                <div className="row cg-1 f-center mt-2">
                    <img src={Asset.twitter}></img>
                    <img src={Asset.instagram}></img>
                    <img src={Asset.discord}></img>
                </div>
            </div>
            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({ ...alertState, open: false })}
            >
                <Alert
                    onClose={() => setAlertState({ ...alertState, open: false })}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>

        </main >
    );
};

export default Home;
