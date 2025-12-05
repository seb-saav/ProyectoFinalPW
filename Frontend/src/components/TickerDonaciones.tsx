import './Ticker.css';

interface TickerProps {
    giftData: {
        senderName: string;
        giftName: string;
        message?: string;
    } | null;
}

export const TickerDonaciones = ({ giftData }: TickerProps) => {

    if (!giftData) return null;

    return (
        <div className="ticker-container">
            <div className="ticker-text">
                🎉 ¡GRACIAS!
                <span style={{ color: '#e9dd93ff', margin: '0 5px' }}> {giftData.senderName} </span>
                , acaba de enviar
                <span style={{ color: '#ff0000ff', margin: '0 5px' }}> {giftData.giftName} </span>
                {giftData.message && <span> — "{giftData.message}" — </span>}
                ¡Tú también puedes apoyar el stream! 🚀 ...
            </div>
            <div className="ticker-text">
                🎉 ¡GRACIAS!
                <span style={{ color: '#e9dd93ff', margin: '0 5px' }}> {giftData.senderName} </span>
                , acaba de enviar
                <span style={{ color: '#ff0000ff', margin: '0 5px' }}> {giftData.giftName} </span>
                {giftData.message && <span> — "{giftData.message}" — </span>}
                ¡Tú también puedes apoyar el stream! 🚀 ...
            </div>
            <div className="ticker-text">
                🎉 ¡GRACIAS!
                <span style={{ color: '#e9dd93ff', margin: '0 5px' }}> {giftData.senderName} </span>
                , acaba de enviar
                <span style={{ color: '#ff0000ff', margin: '0 5px' }}> {giftData.giftName} </span>
                {giftData.message && <span> — "{giftData.message}" — </span>}
                ¡Tú también puedes apoyar el stream! 🚀 ...
            </div>
        </div>

    );
};
