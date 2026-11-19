PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Clientes" (
    "ID" INTEGER PRIMARY KEY,
    "Nome" TEXT NOT NULL CHECK (length(trim("Nome")) > 0),
    "CPF" TEXT NOT NULL UNIQUE CHECK (length("CPF") = 11 AND "CPF" NOT GLOB '*[^0-9]*'),
    "Telefone" TEXT NOT NULL CHECK (length(trim("Telefone")) > 0),
    "Email" TEXT NOT NULL CHECK (length(trim("Email")) > 0)
);

CREATE TABLE IF NOT EXISTS "Pagamentos" (
    "ID" INTEGER PRIMARY KEY,
    "ID_Reserva" INTEGER NOT NULL CHECK ("ID_Reserva" > 0),
    "Valor" INTEGER NOT NULL CHECK ("Valor" >= 0),
    "Data_Pagamento" TEXT NOT NULL CHECK (
        length("Data_Pagamento") = 10
        AND date("Data_Pagamento", '+0 days') IS NOT NULL
        AND date("Data_Pagamento", '+0 days') = "Data_Pagamento"
    ),
    "Método" TEXT NOT NULL CHECK (length(trim("Método")) > 0)
);

CREATE INDEX IF NOT EXISTS "idx_pagamentos_reserva" ON "Pagamentos" ("ID_Reserva");

CREATE TABLE IF NOT EXISTS "Funcionários" (
    "ID" INTEGER PRIMARY KEY,
    "Nome" TEXT NOT NULL CHECK (length(trim("Nome")) > 0),
    "Cargo" TEXT NOT NULL CHECK (length(trim("Cargo")) > 0),
    "Login" TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim("Login")) > 0),
    "Senha" TEXT NOT NULL CHECK (length(trim("Senha")) > 0)
);

-- Extensão aditiva: as três tabelas originais e seus dados são mantidos.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email ON Clientes (Email COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS Contas_Clientes (
    ID_Cliente INTEGER PRIMARY KEY REFERENCES Clientes(ID) ON DELETE CASCADE,
    Login TEXT NOT NULL COLLATE NOCASE UNIQUE,
    Senha TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS Sessoes_Clientes (
    Token_Hash TEXT PRIMARY KEY,
    ID_Cliente INTEGER NOT NULL REFERENCES Clientes(ID) ON DELETE CASCADE,
    Expira_Em INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_cliente ON Sessoes_Clientes (ID_Cliente);
CREATE TABLE IF NOT EXISTS Hospedagens (
    ID TEXT PRIMARY KEY,
    Nome TEXT NOT NULL,
    Localidade TEXT NOT NULL,
    Regiao TEXT NOT NULL,
    Valor_Diaria INTEGER NOT NULL CHECK (Valor_Diaria >= 0)
);
CREATE TABLE IF NOT EXISTS Favoritos (
    ID_Cliente INTEGER NOT NULL REFERENCES Clientes(ID) ON DELETE CASCADE,
    ID_Hospedagem TEXT NOT NULL REFERENCES Hospedagens(ID),
    Criado_Em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ID_Cliente, ID_Hospedagem)
);


-- Reservas simuladas vinculadas ao cliente e à hospedagem.
CREATE TABLE IF NOT EXISTS Reservas (
    ID INTEGER PRIMARY KEY,
    ID_Cliente INTEGER NOT NULL
        REFERENCES Clientes(ID) ON DELETE CASCADE,
    ID_Hospedagem TEXT NOT NULL
        REFERENCES Hospedagens(ID),
    Data_Entrada TEXT NOT NULL CHECK (
        length(Data_Entrada) = 10
        AND date(Data_Entrada, '+0 days') IS NOT NULL
        AND date(Data_Entrada, '+0 days') = Data_Entrada
    ),
    Data_Saida TEXT NOT NULL CHECK (
        length(Data_Saida) = 10
        AND date(Data_Saida, '+0 days') IS NOT NULL
        AND date(Data_Saida, '+0 days') = Data_Saida
    ),
    Hospedes INTEGER NOT NULL CHECK (Hospedes > 0),
    Criado_Em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (Data_Saida > Data_Entrada)
);

CREATE INDEX IF NOT EXISTS idx_reservas_cliente
    ON Reservas (ID_Cliente, Criado_Em);

CREATE INDEX IF NOT EXISTS idx_reservas_disponibilidade
    ON Reservas (ID_Hospedagem, Data_Entrada, Data_Saida);


PRAGMA user_version = 2;
