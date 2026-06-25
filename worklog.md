---
Task ID: 2
Agent: main
Task: Fill all 48 teams with real data + add auto score simulation

Work Log:
- Searched FIFA.com, Wikipedia and NBC for official 2026 World Cup draw results
- Read and parsed official draw pages to extract all 12 groups
- Updated TEAMS and GROUPS in worldcup.ts with all 48 real teams
- Groups confirmed: A(México, África do Sul, Coreia do Sul, Tchéquia), B(Canadá, Bósnia, Catar, Suíça), C(Brasil, Marrocos, Escócia, Haiti), D(EUA, Paraguai, Austrália, Turquia), E(Alemanha, Curaçao, Costa do Marfim, Equador), F(Holanda, Japão, Suécia, Tunísia), G(Bélgica, Egito, Irã, Nova Zelândia), H(Espanha, Cabo Verde, Arábia Saudita, Uruguai), I(França, Senegal, Iraque, Noruega), J(Argentina, Argélia, Áustria, Jordânia), K(Portugal, Jamaica, Uzbequistão, Colômbia), L(Inglaterra, Croácia, Gana, Panamá)
- Created /api/simulate API route that generates realistic random scores
- Added simulateRound(1/2/3), simulateAll() and clearAll() to Zustand store
- Added simulation buttons (R1, R2, R3, Simular Todos, Limpar) + dark mode toggle to Navigation
- Tested: all 48 teams showing with flags, simulation fills scores correctly and standings update

Stage Summary:
- All TBD placeholders replaced with real 2026 WC teams
- Simulation generates realistic scores (draws ~25%, home/away wins distributed)
- Lint passes, browser verified, no runtime errors