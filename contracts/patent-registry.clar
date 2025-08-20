;; Decentralized Patent Registry Contract
;; Clarity v2 (assuming latest syntax as of 2025, compatible with Stacks 2.1+)
;; Handles registration of patents with metadata, document hashes, inventor details, and immutable storage.
;; Provides search and query functionalities.
;; Ensures uniqueness via document hashes, timestamps via block height.
;; Sophisticated features: input validation, event printing, inventor patent lists with limits, basic search.

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TITLE u101)
(define-constant ERR-INVALID-ABSTRACT u102)
(define-constant ERR-INVALID-HASH u103)
(define-constant ERR-PATENT-EXISTS u104)
(define-constant ERR-INVALID-INVENTOR u105)
(define-constant ERR-LIST-FULL u106)
(define-constant ERR-INVALID-ID u107)
(define-constant ERR-PAUSED u108)
(define-constant ERR-ZERO-LENGTH u109)

;; Constants for validation
(define-constant MAX-TITLE-LEN u100) ;; Max length for title (ascii)
(define-constant MAX-ABSTRACT-LEN u500) ;; Max length for abstract (utf8)
(define-constant HASH-LEN u32) ;; SHA256 hash length
(define-constant MAX-INVENTOR-PATENTS u50) ;; Max patents per inventor to prevent list overflow

;; Admin and state variables
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var next-patent-id uint u1)

;; Maps for storage
;; Patents map: id -> patent data tuple
(define-map patents uint 
  {
    title: (string-ascii 100),
    abstract: (string-utf8 500),
    inventor: principal,
    filing-date: uint, ;; block-height
    doc-hash: (buff 32)
  }
)

;; Hash to ID map for uniqueness check
(define-map hash-to-id (buff 32) uint)

;; Inventor to list of patent IDs (limited length list)
(define-map inventor-patents principal (list 50 uint))

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: validate string lengths
(define-private (validate-title (title (string-ascii 100)))
  (if (is-eq (len title) u0)
    (err ERR-ZERO-LENGTH)
    (if (> (len title) MAX-TITLE-LEN)
      (err ERR-INVALID-TITLE)
      (ok true)
    )
  )
)

(define-private (validate-abstract (abstract (string-utf8 500)))
  (if (is-eq (len abstract) u0)
    (err ERR-ZERO-LENGTH)
    (if (> (len abstract) MAX-ABSTRACT-LEN)
      (err ERR-INVALID-ABSTRACT)
      (ok true)
    )
  )
)

(define-private (validate-hash (doc-hash (buff 32)))
  (if (is-eq (len doc-hash) HASH-LEN)
    (ok true)
    (err ERR-INVALID-HASH)
  )
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin tx-sender)) (err ERR-INVALID-INVENTOR)) ;; Prevent self-transfer for safety
    (var-set admin new-admin)
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)
  )
)

;; Register a new patent
(define-public (register-patent (title (string-ascii 100)) (abstract (string-utf8 500)) (doc-hash (buff 32)))
  (let 
    (
      (inventor tx-sender)
      (filing-date block-height)
      (patent-id (var-get next-patent-id))
      (existing-id (map-get? hash-to-id doc-hash))
      (current-list (default-to (list) (map-get? inventor-patents inventor)))
    )
    (ensure-not-paused)
    (try! (validate-title title))
    (try! (validate-abstract abstract))
    (try! (validate-hash doc-hash))
    (asserts! (is-none existing-id) (err ERR-PATENT-EXISTS))
    (asserts! (< (len current-list) MAX-INVENTOR-PATENTS) (err ERR-LIST-FULL))
    ;; Store patent data
    (map-set patents patent-id
      {
        title: title,
        abstract: abstract,
        inventor: inventor,
        filing-date: filing-date,
        doc-hash: doc-hash
      }
    )
    ;; Set hash mapping
    (map-set hash-to-id doc-hash patent-id)
    ;; Append to inventor's list
    (map-set inventor-patents inventor (unwrap! (as-max-len? (append current-list patent-id) u50) (err ERR-LIST-FULL)))
    ;; Increment next ID
    (var-set next-patent-id (+ patent-id u1))
    ;; Print event for indexing
    (print { event: "patent-registered", id: patent-id, inventor: inventor, hash: doc-hash, date: filing-date })
    (ok patent-id)
  )
)

;; Read-only: Get patent by ID
(define-read-only (get-patent (patent-id uint))
  (match (map-get? patents patent-id)
    patent (ok patent)
    (err ERR-INVALID-ID)
  )
)

;; Read-only: Get patent by document hash
(define-read-only (get-patent-by-hash (doc-hash (buff 32)))
  (match (map-get? hash-to-id doc-hash)
    id (get-patent id)
    (err ERR-INVALID-HASH)
  )
)

;; Read-only: Get list of patents for an inventor
(define-read-only (get-inventor-patents (inventor principal))
  (ok (default-to (list) (map-get? inventor-patents inventor)))
)

;; Read-only: Get next patent ID (for preview)
(define-read-only (get-next-patent-id)
  (ok (var-get next-patent-id))
)

;; Read-only: Get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: Check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: Get total patents registered (next-id - 1)
(define-read-only (get-total-patents)
  (ok (- (var-get next-patent-id) u1))
)

;; Private helper for testing or extensions: Note - not public
(define-private (mock-block-height)
  block-height ;; Can be mocked in tests if needed
)