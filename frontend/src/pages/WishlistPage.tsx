import { useNavigate } from 'react-router-dom';
import styles from './WishlistPage.module.css';

interface GiftItem {
  icon: string;
  name: string;
  brand: string;
  category: 'essentials' | 'clothing' | 'feeding' | 'bath';
}

const giftItems: GiftItem[] = [
  // Essentials
  { icon: '🧷', name: 'Diapers (Newborn)', brand: 'Pampers Baby-Dry / Huggies Natural Soft', category: 'essentials' },
  { icon: '🧻', name: 'Unscented Wipes', brand: 'EQ Water Baby Wipes / Any Brand', category: 'essentials' },
  { icon: '🧴', name: 'Baby Liquid Detergent', brand: 'Cycles', category: 'essentials' },
  { icon: '🫧', name: 'Bottle Cleanser', brand: 'Cradle', category: 'essentials' },
  // Clothing
  { icon: '👶', name: 'Long Sleeve Closed Toe Onesie', brand: 'Any Brand', category: 'clothing' },
  { icon: '👕', name: 'Short Sleeve Onesie', brand: 'Any Brand', category: 'clothing' },
  { icon: '🧢', name: 'Baby Cap', brand: 'Any Brand', category: 'clothing' },
  { icon: '🧤', name: 'Baby Mittens', brand: 'Any Brand', category: 'clothing' },
  { icon: '🧦', name: 'Baby Socks', brand: 'Any Brand', category: 'clothing' },
  { icon: '🍼', name: 'Bibs', brand: 'Any Brand', category: 'clothing' },
  // Feeding
  { icon: '🍼', name: 'Wide Neck Feeding Bottle', brand: 'Pigeon / Avent Natural / Dr. Brown\'s Anti Colic', category: 'feeding' },
  { icon: '🥄', name: 'Burp Cloths', brand: 'Any Brand', category: 'feeding' },
  // Bath
  { icon: '🛁', name: 'Baby Wash and Bath', brand: 'Cetaphil Baby', category: 'bath' },
  { icon: '🧸', name: 'Hooded Baby Towel', brand: 'Any Brand', category: 'bath' },
  { icon: '✨', name: 'Any TinyBuds Products', brand: 'TinyBuds', category: 'bath' },
];

const categoryLabels: Record<GiftItem['category'], string> = {
  essentials: '⚡ ESSENTIALS',
  clothing: '👘 CLOTHING',
  feeding: '🍼 FEEDING',
  bath: '🛁 BATH & CARE',
};

export default function WishlistPage() {
  const navigate = useNavigate();

  const groupedItems = giftItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GiftItem[]>);

  return (
    <div className={styles.page}>
      {/* Background bubbles */}
      <div className={styles.bgBubble} aria-hidden="true" />
      <div className={`${styles.bgBubble} ${styles.bgBubble2}`} aria-hidden="true" />
      <div className={`${styles.bgBubble} ${styles.bgBubble3}`} aria-hidden="true" />
      <div className={`${styles.bgBubble} ${styles.bgBubble4}`} aria-hidden="true" />
      <div className={`${styles.bgBubble} ${styles.bgBubble5}`} aria-hidden="true" />

      <button
        className={styles.backBtn}
        onClick={() => navigate('/')}
        type="button"
      >
        ← Back
      </button>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.badge}>BABY ELEJORDE'S</div>
          <h1 className={styles.title}>WISHLIST</h1>
          <p className={styles.subtitle}>Gift Ideas</p>
        </div>

        <div className={styles.messageCard}>
          <p className={styles.message}>
            Your love, presence, and prayers are all that we request.
          </p>
          <p className={styles.messageAlt}>
            But if you wish to give a gift, here's what we suggest:
          </p>
        </div>

        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              {categoryLabels[category as GiftItem['category']]}
            </h2>
            <div className={styles.grid}>
              {items.map((item, idx) => (
                <div key={idx} className={styles.giftCard}>
                  <div className={styles.giftIcon}>{item.icon}</div>
                  <div className={styles.giftInfo}>
                    <h3 className={styles.giftName}>{item.name}</h3>
                    <p className={styles.giftBrand}>{item.brand}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Any amount of support and generosity is highly appreciated as we are extremely excited for our lives to change. 💙
          </p>
        </div>
      </div>
    </div>
  );
}
