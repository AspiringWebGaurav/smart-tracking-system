# Firebase Schema Setup for Dynamic Ban Pages

## Database Structure

### Collection: `banPageDesigns`

This collection stores the configuration for each ban page category design.

```typescript
interface BanPageDesign {
  id: string; // Document ID: 'normal' | 'medium' | 'danger' | 'severe'
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
  
  // Visual Configuration
  theme: {
    primaryColor: string;
    secondaryColor: string;
    gradientFrom: string;
    gradientTo: string;
    accentColor: string;
    textColor: string;
    backgroundColor: string;
    borderColor: string;
    shadowColor: string;
  };
  
  // Content Configuration
  content: {
    title: string;
    subtitle: string;
    description: string;
    warningLevel: 'info' | 'warning' | 'danger' | 'critical';
    icon: {
      type: 'svg' | 'emoji' | 'icon';
      value: string; // SVG path, emoji, or icon name
      size: string;
      color: string;
    };
    processingTime: string;
    appealMessage: string;
    buttonText: string;
    statusBadge: string;
  };
  
  // Layout Configuration
  layout: {
    headerHeight: string;
    contentPadding: string;
    borderRadius: string;
    shadowIntensity: 'light' | 'medium' | 'heavy';
    animationStyle: 'subtle' | 'moderate' | 'intense';
    spacing: {
      small: string;
      medium: string;
      large: string;
    };
  };
  
  // Animation Configuration
  animations: {
    transition: {
      duration: string;
      easing: string;
    };
    pulse: {
      enabled: boolean;
      color: string;
      duration: string;
    };
    entrance: {
      type: 'fade' | 'slide' | 'scale';
      duration: string;
      delay: string;
    };
  };
  
  // Responsive Configuration
  responsive: {
    mobile: {
      padding: string;
      fontSize: {
        title: string;
        subtitle: string;
        body: string;
      };
      gridColumns: number;
    };
    tablet: {
      padding: string;
      fontSize: {
        title: string;
        subtitle: string;
        body: string;
      };
      gridColumns: number;
    };
    desktop: {
      padding: string;
      fontSize: {
        title: string;
        subtitle: string;
        body: string;
      };
      gridColumns: number;
    };
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  changelog: Array<{
    version: number;
    changes: string;
    updatedBy: string;
    updatedAt: string;
  }>;
}
```

### Extended Visitor Schema

```typescript
interface VisitorExtended {
  // ... existing fields from current system
  
  // New ban category fields
  banCategory?: 'normal' | 'medium' | 'danger' | 'severe';
  banCategoryHistory?: Array<{
    category: 'normal' | 'medium' | 'danger' | 'severe';
    timestamp: string;
    adminId: string;
    reason: string;
    previousCategory?: string;
  }>;
  
  // Enhanced ban metadata
  banMetadata?: {
    severity: number; // 1-10 scale
    autoCategory: boolean; // Was category auto-assigned?
    manualOverride: boolean; // Was category manually overridden?
    escalationPath: Array<{
      fromCategory: string;
      toCategory: string;
      timestamp: string;
      adminId: string;
      reason: string;
    }>;
  };
}
```

## Initial Data Seed

### Firebase Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ban page designs - read by all, write by admins only
    match /banPageDesigns/{designId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
    
    // Visitors collection - existing rules + ban category
    match /visitors/{visitorId} {
      allow read: if request.auth != null && 
                     request.auth.token.admin == true;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
      allow read: if resource.id == request.auth.uid; // Users can read their own data
    }
    
    // Ban category audit log
    match /banCategoryAudit/{auditId} {
      allow read, write: if request.auth != null && 
                            request.auth.token.admin == true;
    }
  }
}
```

### Seed Data Script

```typescript
// scripts/seedBanPageDesigns.ts
import { db } from '../lib/firebase-admin';

const banPageDesigns: Record<string, BanPageDesign> = {
  normal: {
    id: 'normal',
    name: 'normal',
    displayName: 'Normal',
    isActive: true,
    sortOrder: 1,
    
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#06B6D4',
      gradientFrom: '#3B82F6',
      gradientTo: '#06B6D4',
      accentColor: '#60A5FA',
      textColor: '#FFFFFF',
      backgroundColor: 'from-slate-900 via-gray-900 to-black',
      borderColor: 'border-blue-500/20',
      shadowColor: 'shadow-blue-500/25'
    },
    
    content: {
      title: 'Access Temporarily Restricted',
      subtitle: 'Portfolio access under policy review',
      description: 'Your access has been temporarily suspended for policy review. This is a standard procedure.',
      warningLevel: 'info',
      icon: {
        type: 'svg',
        value: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        size: 'w-6 h-6',
        color: 'text-blue-400'
      },
      processingTime: '24-48 hours',
      appealMessage: 'If you believe this restriction was applied in error, you may submit an appeal for review.',
      buttonText: 'Submit Appeal',
      statusBadge: 'Under Review'
    },
    
    layout: {
      headerHeight: 'h-32',
      contentPadding: 'p-6',
      borderRadius: 'rounded-2xl',
      shadowIntensity: 'medium',
      animationStyle: 'subtle',
      spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
      }
    },
    
    animations: {
      transition: {
        duration: '300ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      pulse: {
        enabled: true,
        color: '#60A5FA',
        duration: '2s'
      },
      entrance: {
        type: 'fade',
        duration: '500ms',
        delay: '100ms'
      }
    },
    
    responsive: {
      mobile: {
        padding: '1rem',
        fontSize: {
          title: 'text-lg',
          subtitle: 'text-sm',
          body: 'text-xs'
        },
        gridColumns: 1
      },
      tablet: {
        padding: '1.5rem',
        fontSize: {
          title: 'text-xl',
          subtitle: 'text-base',
          body: 'text-sm'
        },
        gridColumns: 2
      },
      desktop: {
        padding: '2rem',
        fontSize: {
          title: 'text-2xl',
          subtitle: 'text-lg',
          body: 'text-base'
        },
        gridColumns: 3
      }
    },
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    version: 1,
    changelog: [{
      version: 1,
      changes: 'Initial design configuration',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    }]
  },

  medium: {
    id: 'medium',
    name: 'medium',
    displayName: 'Medium',
    isActive: true,
    sortOrder: 2,
    
    theme: {
      primaryColor: '#F59E0B',
      secondaryColor: '#EAB308',
      gradientFrom: '#F59E0B',
      gradientTo: '#EAB308',
      accentColor: '#FBBF24',
      textColor: '#FFFFFF',
      backgroundColor: 'from-slate-900 via-amber-900/10 to-black',
      borderColor: 'border-amber-500/20',
      shadowColor: 'shadow-amber-500/25'
    },
    
    content: {
      title: 'Access Suspended',
      subtitle: 'Policy violations detected',
      description: 'Your access has been suspended due to policy violations. Immediate attention required.',
      warningLevel: 'warning',
      icon: {
        type: 'svg',
        value: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
        size: 'w-6 h-6',
        color: 'text-amber-400'
      },
      processingTime: '24-48 hours',
      appealMessage: 'Review the policy violations and submit an appeal if you believe this action was taken in error.',
      buttonText: 'Submit Appeal',
      statusBadge: 'Review Required'
    },
    
    layout: {
      headerHeight: 'h-32',
      contentPadding: 'p-6',
      borderRadius: 'rounded-2xl',
      shadowIntensity: 'medium',
      animationStyle: 'moderate',
      spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
      }
    },
    
    animations: {
      transition: {
        duration: '400ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      pulse: {
        enabled: true,
        color: '#FBBF24',
        duration: '1.5s'
      },
      entrance: {
        type: 'slide',
        duration: '600ms',
        delay: '150ms'
      }
    },
    
    responsive: {
      mobile: {
        padding: '1rem',
        fontSize: {
          title: 'text-lg',
          subtitle: 'text-sm',
          body: 'text-xs'
        },
        gridColumns: 1
      },
      tablet: {
        padding: '1.5rem',
        fontSize: {
          title: 'text-xl',
          subtitle: 'text-base',
          body: 'text-sm'
        },
        gridColumns: 2
      },
      desktop: {
        padding: '2rem',
        fontSize: {
          title: 'text-2xl',
          subtitle: 'text-lg',
          body: 'text-base'
        },
        gridColumns: 3
      }
    },
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    version: 1,
    changelog: [{
      version: 1,
      changes: 'Initial design configuration',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    }]
  },

  danger: {
    id: 'danger',
    name: 'danger',
    displayName: 'Danger',
    isActive: true,
    sortOrder: 3,
    
    theme: {
      primaryColor: '#F97316',
      secondaryColor: '#EF4444',
      gradientFrom: '#F97316',
      gradientTo: '#EF4444',
      accentColor: '#FB923C',
      textColor: '#FFFFFF',
      backgroundColor: 'from-slate-900 via-red-900/20 to-black',
      borderColor: 'border-orange-500/30',
      shadowColor: 'shadow-orange-500/25'
    },
    
    content: {
      title: 'Access Denied',
      subtitle: 'Serious policy violations detected',
      description: 'Access has been denied due to serious policy violations. This action requires immediate administrative review.',
      warningLevel: 'danger',
      icon: {
        type: 'svg',
        value: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        size: 'w-6 h-6',
        color: 'text-orange-400'
      },
      processingTime: '48-72 hours',
      appealMessage: 'Serious violations have been detected. Appeals will be thoroughly reviewed by our security team.',
      buttonText: 'Submit Formal Appeal',
      statusBadge: 'Security Review'
    },
    
    layout: {
      headerHeight: 'h-36',
      contentPadding: 'p-6',
      borderRadius: 'rounded-2xl',
      shadowIntensity: 'heavy',
      animationStyle: 'intense',
      spacing: {
        small: '0.75rem',
        medium: '1.25rem',
        large: '2rem'
      }
    },
    
    animations: {
      transition: {
        duration: '500ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      pulse: {
        enabled: true,
        color: '#FB923C',
        duration: '1s'
      },
      entrance: {
        type: 'scale',
        duration: '700ms',
        delay: '200ms'
      }
    },
    
    responsive: {
      mobile: {
        padding: '1rem',
        fontSize: {
          title: 'text-lg',
          subtitle: 'text-sm',
          body: 'text-xs'
        },
        gridColumns: 1
      },
      tablet: {
        padding: '1.5rem',
        fontSize: {
          title: 'text-xl',
          subtitle: 'text-base',
          body: 'text-sm'
        },
        gridColumns: 2
      },
      desktop: {
        padding: '2rem',
        fontSize: {
          title: 'text-2xl',
          subtitle: 'text-lg',
          body: 'text-base'
        },
        gridColumns: 3
      }
    },
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    version: 1,
    changelog: [{
      version: 1,
      changes: 'Initial design configuration',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    }]
  },

  severe: {
    id: 'severe',
    name: 'severe',
    displayName: 'Severe',
    isActive: true,
    sortOrder: 4,
    
    theme: {
      primaryColor: '#DC2626',
      secondaryColor: '#991B1B',
      gradientFrom: '#DC2626',
      gradientTo: '#991B1B',
      accentColor: '#F87171',
      textColor: '#FFFFFF',
      backgroundColor: 'from-slate-900 via-red-900/30 to-black',
      borderColor: 'border-red-600/40',
      shadowColor: 'shadow-red-600/25'
    },
    
    content: {
      title: 'Access Permanently Restricted',
      subtitle: 'Critical security violation',
      description: 'Access has been permanently restricted due to critical policy violations. This decision requires executive review.',
      warningLevel: 'critical',
      icon: {
        type: 'svg',
        value: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728',
        size: 'w-8 h-8',
        color: 'text-red-400'
      },
      processingTime: '72-96 hours',
      appealMessage: 'Critical violations detected. Appeals require executive review and may take extended time to process.',
      buttonText: 'Submit Executive Appeal',
      statusBadge: 'Executive Review'
    },
    
    layout: {
      headerHeight: 'h-40',
      contentPadding: 'p-8',
      borderRadius: 'rounded-3xl',
      shadowIntensity: 'heavy',
      animationStyle: 'intense',
      spacing: {
        small: '1rem',
        medium: '1.5rem',
        large: '2.5rem'
      }
    },
    
    animations: {
      transition: {
        duration: '600ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      pulse: {
        enabled: true,
        color: '#F87171',
        duration: '0.8s'
      },
      entrance: {
        type: 'scale',
        duration: '800ms',
        delay: '250ms'
      }
    },
    
    responsive: {
      mobile: {
        padding: '1.25rem',
        fontSize: {
          title: 'text-xl',
          subtitle: 'text-base',
          body: 'text-sm'
        },
        gridColumns: 1
      },
      tablet: {
        padding: '1.75rem',
        fontSize: {
          title: 'text-2xl',
          subtitle: 'text-lg',
          body: 'text-base'
        },
        gridColumns: 2
      },
      desktop: {
        padding: '2.5rem',
        fontSize: {
          title: 'text-3xl',
          subtitle: 'text-xl',
          body: 'text-lg'
        },
        gridColumns: 3
      }
    },
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    version: 1,
    changelog: [{
      version: 1,
      changes: 'Initial design configuration',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    }]
  }
};

export async function seedBanPageDesigns() {
  const batch = db.batch();
  
  Object.entries(banPageDesigns).forEach(([id, design]) => {
    const docRef = db.collection('banPageDesigns').doc(id);
    batch.set(docRef, design);
  });
  
  await batch.commit();
  console.log('✅ Ban page designs seeded successfully');
}

// Run the seed function
if (require.main === module) {
  seedBanPageDesigns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error seeding ban page designs:', error);
      process.exit(1);
    });
}
```

## Database Indexes

```javascript
// Required Firestore indexes
const indexes = [
  {
    collectionGroup: 'banPageDesigns',
    fields: [
      { fieldPath: 'isActive', order: 'ASCENDING' },
      { fieldPath: 'sortOrder', order: 'ASCENDING' }
    ]
  },
  {
    collectionGroup: 'visitors',
    fields: [
      { fieldPath: 'banCategory', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'banCategoryAudit',
    fields: [
      { fieldPath: 'visitorUuid', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ]
  }
];
```

## Migration Script

```typescript
// scripts/migrateBanCategories.ts
import { db } from '../lib/firebase-admin';

export async function migrateBanCategories() {
  console.log('🔄 Starting ban category migration...');
  
  // Get all existing banned visitors
  const visitorsSnapshot = await db
    .collection('visitors')
    .where('status', '==', 'banned')
    .get();
  
  const batch = db.batch();
  let updateCount = 0;
  
  visitorsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // Only update if banCategory doesn't exist
    if (!data.banCategory) {
      // Default to 'normal' category for existing bans
      batch.update(doc.ref, {
        banCategory: 'normal',
        banCategoryHistory: [{
          category: 'normal',
          timestamp: new Date().toISOString(),
          adminId: 'system',
          reason: 'Migration - default category assignment',
          previousCategory: null
        }],
        banMetadata: {
          severity: 1,
          autoCategory: true,
          manualOverride: false,
          escalationPath: []
        }
      });
      updateCount++;
    }
  });
  
  if (updateCount > 0) {
    await batch.commit();
    console.log(`✅ Migrated ${updateCount} visitors to use ban categories`);
  } else {
    console.log('✅ No migration needed - all visitors already have categories');
  }
}
```

## Environment Variables

Add to `.env.local`:
```bash
# Ban Page System Configuration
NEXT_PUBLIC_BAN_PAGES_ENABLED=true
NEXT_PUBLIC_BAN_CATEGORY_SYNC_ENABLED=true
NEXT_PUBLIC_BAN_DESIGN_CACHE_TTL=300000
```

## Security Considerations

1. **Admin-only writes**: Only authenticated admins can modify ban page designs
2. **Audit trail**: All category changes are logged with admin ID and timestamp
3. **Validation**: Server-side validation of category values and design configurations
4. **Rate limiting**: Prevent rapid category switching to avoid abuse
5. **Fallback security**: System defaults to most restrictive category on errors

This Firebase schema provides a robust foundation for the dynamic ban pages system while maintaining security, performance, and scalability.