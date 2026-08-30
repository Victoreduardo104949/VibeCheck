import { ChatData } from "../../types";

const d = (day: number, hour: number, minute: number) => new Date(2026, 7, day, hour, minute, 0);

export const ANABRUNO_CHAT: ChatData = {
    participants: ["Ana", "Bruno"],
    title: "Ana, Bruno",
    messages: [
        { id: "m0", date: d(1, 10, 0), author: "Ana", content: "oi amor, tudo bem?", isSystem: false },
        { id: "m1", date: d(1, 10, 5), author: "Bruno", content: "tudo ótimo e você? 😊", isSystem: false },
        { id: "m2", date: d(1, 10, 12), author: "Ana", content: "melhor agora que você respondeu hehe", isSystem: false },
        { id: "m3", date: d(1, 10, 12), author: "Bruno", content: "sempre tento responder rápido 😄", isSystem: false },
        { id: "m4", date: d(1, 13, 0), author: "Ana", content: "que tal jantar hoje?", isSystem: false },
        { id: "m5", date: d(1, 16, 0), author: "Bruno", content: "topo! 20h no sushi?", isSystem: false },
        { id: "m6", date: d(1, 16, 2), author: "Ana", content: "fechou ❤️", isSystem: false },
        { id: "m7", date: d(1, 20, 0), author: "System", content: "Mensagens alteradas", isSystem: true },
        { id: "m8", date: d(1, 21, 0), author: "Bruno", content: "cheguei, vamos entrar?", isSystem: false },
        { id: "m9", date: d(1, 21, 30), author: "Ana", content: "claro, já desço 😘", isSystem: false },
        { id: "m10", date: d(3, 9, 0), author: "Bruno", content: "bom dia, saudade de ontem", isSystem: false },
        { id: "m11", date: d(3, 9, 10), author: "Ana", content: "bom dia! eu também 😍", isSystem: false },
        { id: "m12", date: d(3, 9, 15), author: "Bruno", content: "", isSystem: false },
        { id: "m13", date: d(3, 9, 20), author: "Bruno", content: "olha a foto que tirei", isSystem: false },
        { id: "m14", date: d(3, 9, 22), author: "Ana", content: "que foto linda!", isSystem: false },
        { id: "m15", date: d(4, 8, 0), author: "Bruno", content: "vc vai no aniversário do João?", isSystem: false },
        { id: "m16", date: d(6, 12, 0), author: "Ana", content: "foi mal a demora, tava viajando", isSystem: false },
        { id: "m17", date: d(6, 12, 30), author: "Bruno", content: "sem problema, me conta da viagem!", isSystem: false },
        { id: "m18", date: d(6, 13, 0), author: "Ana", content: "foi ótima, muita praia e sol ☀️", isSystem: false },
    ]
};