# AI Assistant Popup Behavior Test Plan

## Expected Behavior (Fixed Implementation)

### Development & Production Should Both Show:

1. **Initial Load:**
   - Portfolio loads
   - After 4 seconds: "Hi, Gaurav's Personal AI is here." popup appears
   - Popup auto-hides after 4 seconds

2. **Recurring Behavior:**
   - Every 10 seconds after initial popup: Same popup appears again
   - This continues until user clicks the AI bubble or opens the AI assistant

3. **User Interaction:**
   - When user clicks AI bubble: Flash popup → Main AI interface opens
   - Once AI is opened: All future popups stop (hasOpenedAI = true)

## Key Fixes Applied:

1. **Fixed Hydration Issues:**
   - Added `isClient` state to prevent SSR/client mismatch
   - All localStorage operations now happen only on client-side

2. **Fixed Popup State Persistence:**
   - Removed localStorage saving of popup session state
   - Each page load/session resets popup behavior
   - Only user preferences (hasOpenedAI, hasClosedBefore) are persisted

3. **Improved Recurring Logic:**
   - Better condition checking for recurring timer
   - Added console logs for debugging
   - Cleaner timer management

4. **Session-Based Approach:**
   - Popup behavior resets each session
   - Consistent between dev and production
   - No stale localStorage state affecting behavior

## Test Steps:

1. Load portfolio in dev environment
2. Wait 4 seconds - should see initial popup
3. Wait 10 more seconds - should see recurring popup
4. Repeat step 3 multiple times to verify consistency
5. Click AI bubble to test interaction flow
6. Refresh page to test session reset

## Production Deployment Test:

After vercel deployment:
1. Clear browser localStorage/sessionStorage
2. Load production site
3. Follow same test steps as above
4. Behavior should match development exactly