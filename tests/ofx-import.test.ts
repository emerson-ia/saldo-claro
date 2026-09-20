import { describe, expect, it } from "vitest";
import { parseOfxTransactions } from "../lib/ofx-import";

describe("OFX import", () => {
  it("imports credited and debited bank transactions", () => {
    const content = `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
      <STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260901120000<TRNAMT>1500.00<FITID>1<NAME>Salário
      <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260902120000<TRNAMT>-89.90<FITID>2<MEMO>Mercado
    </BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    expect(parseOfxTransactions(content)).toEqual([
      { date: "2026-09-01", description: "Salário", amount: 1500, kind: "income", sourceTransactionId: "1" },
      { date: "2026-09-02", description: "Mercado", amount: 89.9, kind: "expense", sourceTransactionId: "2" },
    ]);
  });

  it("uses TRNTYPE when a bank exports a debit as a positive amount", () => {
    const content = `<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260903<TRNAMT>42.90<FITID>3<NAME>Padaria</STMTTRN></BANKTRANLIST></OFX>`;

    expect(parseOfxTransactions(content)).toEqual([
      { date: "2026-09-03", description: "Padaria", amount: 42.9, kind: "expense", sourceTransactionId: "3" },
    ]);
  });

  it("imports localized amounts from UTF-16 content read as text", () => {
    const utf16LikeContent = "\uFEFF<\u0000O\u0000F\u0000X\u0000>\u0000<\u0000B\u0000A\u0000N\u0000K\u0000T\u0000R\u0000A\u0000N\u0000L\u0000I\u0000S\u0000T\u0000>\u0000<\u0000S\u0000T\u0000M\u0000T\u0000T\u0000R\u0000N\u0000>\u0000<\u0000T\u0000R\u0000N\u0000T\u0000Y\u0000P\u0000E\u0000>\u0000D\u0000E\u0000B\u0000I\u0000T\u0000<\u0000D\u0000T\u0000P\u0000O\u0000S\u0000T\u0000E\u0000D\u0000>\u00002\u00000\u00002\u00006\u00000\u00009\u00000\u00002\u0000<\u0000T\u0000R\u0000N\u0000A\u0000M\u0000T\u0000>\u0000-\u00001\u0000.\u00002\u00003\u00004\u0000,\u00005\u00006\u0000<\u0000N\u0000A\u0000M\u0000E\u0000>\u0000M\u0000e\u0000r\u0000c\u0000a\u0000d\u0000o\u0000<\u0000/\u0000B\u0000A\u0000N\u0000K\u0000T\u0000R\u0000A\u0000N\u0000L\u0000I\u0000S\u0000T\u0000>\u0000<\u0000/\u0000O\u0000F\u0000X\u0000>";

    expect(parseOfxTransactions(utf16LikeContent)).toEqual([
      { date: "2026-09-02", description: "Mercado", amount: 1234.56, kind: "expense" },
    ]);
  });
});
