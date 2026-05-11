// ============================================================================
// 🚀 MOTOR DE FILA VIRTUAL — Min-Heap Priority Queue + Ciclos de Desfogue
// ============================================================================
//
// Reescritura completa usando una Cola de Prioridad basada en un Min-Heap
// binario, logrando las siguientes complejidades:
//
//   Operación         | Antes (Array)  | Ahora (Min-Heap)
//   ─────────────────-┼───────────────-┼──────────────────
//   joinQueue()       |    O(n)        |   O(log n)
//   getPosition()     |    O(n)        |   O(1) lookup
//   executeCycle()    |    O(n)        |   O(K · log n)
//   removeUser()      |    O(n)        |   O(log n)
//
// El peso de cada usuario se calcula como:
//   weight = arrivalTimestamp - (fanBonus * FAN_BONUS_WEIGHT)
//
// Un peso MENOR = mayor prioridad (Min-Heap).
// Los fans verificados reciben un bonus que reduce su peso, efectivamente
// avanzándolos en la fila sin saltar a todos.
//
// ============================================================================

// ---------------------------------------------------------------------------
// Constantes de configuración
// ---------------------------------------------------------------------------

/** Capacidad máxima de usuarios simultáneos en el mapa sin latencia */
export const MAX_K_VALUE = 150;

/** Valor mínimo de K bajo carga extrema */
export const MIN_K_VALUE = 10;

/** Intervalo entre ciclos de desfogue (ms) — 1 minuto */
export const CYCLE_INTERVAL_MS = 60_000;

/** Umbral de latencia: inicio de degradación */
export const LATENCY_THRESHOLD_HIGH = 500;

/** Umbral de latencia: estado crítico */
export const LATENCY_THRESHOLD_CRITICAL = 1500;

/** Factor de reducción de K en degradación */
export const K_REDUCTION_FACTOR_HIGH = 0.75;

/** Factor de reducción de K en estado crítico */
export const K_REDUCTION_FACTOR_CRITICAL = 0.50;

/** Factor de recuperación de K cuando la latencia es normal */
export const K_RECOVERY_FACTOR = 1.15;

/**
 * Peso del bonus de fan verificado (en milisegundos equivalentes).
 * Un fan verificado "gana" este tiempo de ventaja sobre un usuario normal.
 * Valor: 120_000ms = 2 minutos de ventaja efectiva.
 */
const FAN_BONUS_WEIGHT = 120_000;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface QueueUser {
  /** Identificador único del usuario */
  id: string;
  /** Email del usuario */
  email: string;
  /** ID del evento */
  eventId: string;
  /** Timestamp de ingreso (Unix ms) */
  joinedAt: number;
  /** Posición visual (recalculada desde el heap) */
  position: number;
  /** Estado del usuario */
  status: "waiting" | "admitted" | "expired";
  /**
   * Si el usuario es un fan verificado del artista.
   * true = recibe bonus de prioridad.
   */
  isFanVerified: boolean;
  /**
   * Peso calculado para el Min-Heap.
   * weight = joinedAt - (isFanVerified ? FAN_BONUS_WEIGHT : 0)
   * Menor peso = mayor prioridad.
   */
  weight: number;
}

export interface CycleState {
  cycleNumber: number;
  currentK: number;
  cycleStartedAt: number;
  nextCycleAt: number;
  secondsUntilNextCycle: number;
  lastBatchSize: number;
  totalInQueue: number;
  recentLatencies: number[];
  avgLatency: number;
  healthStatus: "optimal" | "degraded" | "critical";
}

export interface QueuePosition {
  position: number;
  totalInQueue: number;
  batchNumber: number;
  estimatedCyclesRemaining: number;
  estimatedWaitSeconds: number;
  statusMessage: string;
  cycleState: CycleState;
}

// ============================================================================
// MIN-HEAP — Implementación genérica de Cola de Prioridad
// ============================================================================
//
// Un Min-Heap binario donde el nodo con MENOR `weight` siempre está en la raíz.
//
// Propiedades:
//   - Insert:    O(log n)  — siftUp desde la última posición
//   - ExtractMin: O(log n) — siftDown desde la raíz
//   - Peek:      O(1)      — acceso directo al índice 0
//   - Remove(id): O(log n) — con indexMap de búsqueda O(1)
//
// La indexación por id permite lookup O(1) para consultar posiciones
// sin necesidad de recorrer todo el array.
// ============================================================================

class MinHeap {
  /** Array que almacena los nodos del heap */
  private heap: QueueUser[] = [];

  /**
   * Mapa de id → índice en el heap.
   * Permite operaciones de búsqueda y eliminación en O(1) + O(log n).
   */
  private indexMap = new Map<string, number>();

  /** Cantidad de elementos en el heap */
  get size(): number {
    return this.heap.length;
  }

  /** Retorna true si el heap está vacío */
  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  // ─── Helpers de navegación ───

  private parent(i: number): number {
    return (i - 1) >>> 1; // Math.floor((i-1)/2) con bitwise
  }

  private left(i: number): number {
    return 2 * i + 1;
  }

  private right(i: number): number {
    return 2 * i + 2;
  }

  /** Intercambia dos nodos y actualiza el indexMap */
  private swap(i: number, j: number): void {
    const a = this.heap[i];
    const b = this.heap[j];
    this.heap[i] = b;
    this.heap[j] = a;
    this.indexMap.set(b.id, i);
    this.indexMap.set(a.id, j);
  }

  // ─── Operaciones fundamentales del Min-Heap ───

  /**
   * Sube un nodo hasta restaurar la propiedad del heap.
   * Complejidad: O(log n)
   */
  private siftUp(i: number): void {
    while (i > 0) {
      const p = this.parent(i);
      if (this.heap[i].weight < this.heap[p].weight) {
        this.swap(i, p);
        i = p;
      } else {
        break;
      }
    }
  }

  /**
   * Baja un nodo hasta restaurar la propiedad del heap.
   * Complejidad: O(log n)
   */
  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = this.left(i);
      const r = this.right(i);

      if (l < n && this.heap[l].weight < this.heap[smallest].weight) {
        smallest = l;
      }
      if (r < n && this.heap[r].weight < this.heap[smallest].weight) {
        smallest = r;
      }

      if (smallest !== i) {
        this.swap(i, smallest);
        i = smallest;
      } else {
        break;
      }
    }
  }

  // ─── API pública ───

  /**
   * Inserta un usuario en el heap.
   * Complejidad: O(log n)
   */
  insert(user: QueueUser): void {
    // Si ya existe, actualizar su peso (por ej. si cambia su fan status)
    if (this.indexMap.has(user.id)) {
      this.updateWeight(user.id, user.weight);
      return;
    }

    const idx = this.heap.length;
    this.heap.push(user);
    this.indexMap.set(user.id, idx);
    this.siftUp(idx);
  }

  /**
   * Extrae el usuario con menor peso (mayor prioridad).
   * Complejidad: O(log n)
   */
  extractMin(): QueueUser | null {
    if (this.heap.length === 0) return null;

    const min = this.heap[0];
    const last = this.heap.pop()!;
    this.indexMap.delete(min.id);

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(last.id, 0);
      this.siftDown(0);
    }

    return min;
  }

  /**
   * Retorna el usuario con menor peso sin extraerlo.
   * Complejidad: O(1)
   */
  peek(): QueueUser | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Busca un usuario por ID.
   * Complejidad: O(1) — gracias al indexMap
   */
  find(id: string): QueueUser | null {
    const idx = this.indexMap.get(id);
    return idx !== undefined ? this.heap[idx] : null;
  }

  /**
   * Verifica si un usuario está en el heap.
   * Complejidad: O(1)
   */
  has(id: string): boolean {
    return this.indexMap.has(id);
  }

  /**
   * Elimina un usuario del heap por ID.
   * Complejidad: O(log n)
   *
   * Estrategia: swap con el último elemento, pop, luego sift en ambas
   * direcciones para restaurar la propiedad.
   */
  remove(id: string): QueueUser | null {
    const idx = this.indexMap.get(id);
    if (idx === undefined) return null;

    const removed = this.heap[idx];
    this.indexMap.delete(id);

    const last = this.heap.pop()!;

    // Si el removido no era el último
    if (idx < this.heap.length) {
      this.heap[idx] = last;
      this.indexMap.set(last.id, idx);
      // Restaurar propiedad del heap en ambas direcciones
      this.siftUp(idx);
      this.siftDown(idx);
    }

    return removed;
  }

  /**
   * Actualiza el peso de un usuario y reposiciona en el heap.
   * Complejidad: O(log n)
   */
  updateWeight(id: string, newWeight: number): void {
    const idx = this.indexMap.get(id);
    if (idx === undefined) return;

    const oldWeight = this.heap[idx].weight;
    this.heap[idx].weight = newWeight;

    if (newWeight < oldWeight) {
      this.siftUp(idx);
    } else {
      this.siftDown(idx);
    }
  }

  /**
   * Extrae los primeros K usuarios con menor peso.
   * Complejidad: O(K · log n) — mucho mejor que sort O(n log n)
   */
  extractBatch(k: number): QueueUser[] {
    const batch: QueueUser[] = [];
    const count = Math.min(k, this.heap.length);

    for (let i = 0; i < count; i++) {
      const user = this.extractMin();
      if (user) batch.push(user);
    }

    return batch;
  }

  /**
   * Calcula la posición relativa de un usuario en la cola.
   *
   * Esto requiere un recorrido completo del heap O(n), pero se usa
   * infrecuentemente (solo cuando el usuario pide su posición).
   * Para la operación crítica (extractBatch), se mantiene O(K·log n).
   *
   * Posición = cuántos usuarios tienen un peso MENOR que el dado + 1.
   */
  getPosition(id: string): number {
    const idx = this.indexMap.get(id);
    if (idx === undefined) return -1;

    const userWeight = this.heap[idx].weight;
    let pos = 1;
    for (let i = 0; i < this.heap.length; i++) {
      if (i !== idx && this.heap[i].weight < userWeight) {
        pos++;
      }
    }
    return pos;
  }

  /**
   * Retorna una snapshot ordenada del heap (para debug/admin).
   * Complejidad: O(n log n) — NO usar en hot path.
   */
  toSortedArray(): QueueUser[] {
    return [...this.heap].sort((a, b) => a.weight - b.weight);
  }
}

// ============================================================================
// ESTADO EN MEMORIA — Por evento
// ============================================================================

interface EventQueue {
  /** Min-Heap de usuarios en espera */
  waitingHeap: MinHeap;
  /** Set de IDs de usuarios admitidos — O(1) lookup */
  admittedSet: Set<string>;
  /** Registro completo de usuarios (para consultas de estado) */
  allUsers: Map<string, QueueUser>;
  /** Número de ciclo actual */
  cycleNumber: number;
  /** Valor actual de K */
  currentK: number;
  /** Timestamp del último ciclo */
  lastCycleAt: number;
  /** Últimas latencias observadas */
  recentLatencies: number[];
  /** Tamaño del último lote liberado */
  lastBatchSize: number;
}

const eventQueues = new Map<string, EventQueue>();

// ---------------------------------------------------------------------------
// Funciones de utilería
// ---------------------------------------------------------------------------

function getOrCreateQueue(eventId: string): EventQueue {
  let queue = eventQueues.get(eventId);
  if (!queue) {
    queue = {
      waitingHeap: new MinHeap(),
      admittedSet: new Set(),
      allUsers: new Map(),
      cycleNumber: 0,
      currentK: MAX_K_VALUE,
      lastCycleAt: Date.now(),
      recentLatencies: [],
      lastBatchSize: 0,
    };
    eventQueues.set(eventId, queue);
  }
  return queue;
}

/**
 * Calcula el peso de prioridad para un usuario.
 *
 * Formula: weight = joinedAt - (isFanVerified ? FAN_BONUS_WEIGHT : 0)
 *
 * Un peso menor = mayor prioridad en el Min-Heap.
 * Los fans verificados reciben una reducción de peso equivalente a
 * FAN_BONUS_WEIGHT ms (como si hubieran llegado antes).
 *
 * @complexity O(1)
 */
function calculateWeight(joinedAt: number, isFanVerified: boolean): number {
  return joinedAt - (isFanVerified ? FAN_BONUS_WEIGHT : 0);
}

function getHealthStatus(avgLatency: number): CycleState["healthStatus"] {
  if (avgLatency >= LATENCY_THRESHOLD_CRITICAL) return "critical";
  if (avgLatency >= LATENCY_THRESHOLD_HIGH) return "degraded";
  return "optimal";
}

function generateStatusMessage(
  position: number,
  batchNumber: number,
  estimatedCycles: number,
  secondsUntilNext: number,
  healthStatus: CycleState["healthStatus"]
): string {
  if (position === 0) {
    return "¡Es tu turno! Redirigiendo al mapa de asientos...";
  }

  if (estimatedCycles <= 1) {
    return `Optimizando acceso... Próximo grupo en ${secondsUntilNext} segundos`;
  }

  if (healthStatus === "critical") {
    return `Alta demanda detectada. Optimizando servidores... Tu grupo (#${batchNumber}) será atendido en aproximadamente ${estimatedCycles} ciclos`;
  }

  if (healthStatus === "degraded") {
    return `Optimizando acceso... Tu grupo será liberado en ~${Math.ceil(estimatedCycles * CYCLE_INTERVAL_MS / 60000)} min`;
  }

  return `Estás en el grupo #${batchNumber}. Próximo lote en ${secondsUntilNext} segundos`;
}

// ---------------------------------------------------------------------------
// 1. UNIRSE A LA FILA — O(log n)
// ---------------------------------------------------------------------------

/**
 * Registra un usuario en la fila virtual con prioridad basada en peso.
 *
 * El peso se calcula como:
 *   weight = arrivalTime - (fanBonus)
 *
 * @param eventId   - ID del evento
 * @param userId    - ID del usuario
 * @param email     - Email del usuario
 * @param isFanVerified - Si el usuario es fan verificado (default: false)
 *
 * @complexity O(log n) — inserción en el Min-Heap
 */
export function joinQueue(
  eventId: string,
  userId: string,
  email: string,
  isFanVerified: boolean = false
): QueuePosition {
  const queue = getOrCreateQueue(eventId);

  // Si ya está en el heap, retornar su posición actual
  if (queue.waitingHeap.has(userId)) {
    return getQueuePosition(eventId, userId);
  }

  // Si ya fue admitido, retornar posición 0
  if (queue.admittedSet.has(userId)) {
    return getQueuePosition(eventId, userId);
  }

  const now = Date.now();
  const weight = calculateWeight(now, isFanVerified);

  const newUser: QueueUser = {
    id: userId,
    email,
    eventId,
    joinedAt: now,
    position: 0, // Se recalcula al consultar
    status: "waiting",
    isFanVerified,
    weight,
  };

  // O(log n) — inserción en el Min-Heap
  queue.waitingHeap.insert(newUser);
  queue.allUsers.set(userId, newUser);

  return getQueuePosition(eventId, userId);
}

// ---------------------------------------------------------------------------
// 2. CONSULTAR POSICIÓN — O(n) amortizado, O(1) para admitidos
// ---------------------------------------------------------------------------

/**
 * Obtiene la posición actual de un usuario en la fila.
 *
 * Para usuarios admitidos: O(1)
 * Para usuarios en espera: O(n) — se cuenta cuántos tienen menor peso
 */
export function getQueuePosition(
  eventId: string,
  userId: string
): QueuePosition {
  const queue = getOrCreateQueue(eventId);

  const totalInQueue = queue.waitingHeap.size;

  // Si fue admitido → posición 0
  if (queue.admittedSet.has(userId)) {
    const now = Date.now();
    const elapsed = now - queue.lastCycleAt;
    const remainingMs = Math.max(CYCLE_INTERVAL_MS - elapsed, 0);
    const secondsUntilNext = Math.ceil(remainingMs / 1000);
    const avgLatency = calcAvgLatency(queue);

    return {
      position: 0,
      totalInQueue,
      batchNumber: 0,
      estimatedCyclesRemaining: 0,
      estimatedWaitSeconds: 0,
      statusMessage: "¡Es tu turno! Redirigiendo al mapa de asientos...",
      cycleState: buildCycleState(queue, secondsUntilNext, avgLatency),
    };
  }

  // Calcular posición en el heap
  const position = queue.waitingHeap.getPosition(userId);
  const effectivePos = position === -1 ? totalInQueue + 1 : position;

  // Calcular información del ciclo
  const batchNumber = Math.ceil(effectivePos / queue.currentK);
  const estimatedCyclesRemaining = Math.max(batchNumber - 1, 0);
  const now = Date.now();
  const elapsed = now - queue.lastCycleAt;
  const remainingMs = Math.max(CYCLE_INTERVAL_MS - elapsed, 0);
  const secondsUntilNext = Math.ceil(remainingMs / 1000);
  const estimatedWaitSeconds =
    estimatedCyclesRemaining * (CYCLE_INTERVAL_MS / 1000) + secondsUntilNext;
  const avgLatency = calcAvgLatency(queue);
  const healthStatus = getHealthStatus(avgLatency);

  return {
    position: Math.max(effectivePos, 0),
    totalInQueue,
    batchNumber,
    estimatedCyclesRemaining,
    estimatedWaitSeconds,
    statusMessage: generateStatusMessage(
      effectivePos <= 0 ? 0 : effectivePos,
      batchNumber,
      estimatedCyclesRemaining,
      secondsUntilNext,
      healthStatus
    ),
    cycleState: buildCycleState(queue, secondsUntilNext, avgLatency),
  };
}

// ---------------------------------------------------------------------------
// 3. EJECUTAR CICLO DE DESFOGUE — O(K · log n)
// ---------------------------------------------------------------------------

/**
 * Ejecuta un ciclo: extrae los K usuarios con mayor prioridad (menor peso)
 * del Min-Heap y los marca como admitidos.
 *
 * @complexity O(K · log n) — K extracciones del Min-Heap
 */
export function executeCycle(eventId: string): string[] {
  const queue = getOrCreateQueue(eventId);
  const now = Date.now();

  // Verificar que ha pasado suficiente tiempo
  const elapsed = now - queue.lastCycleAt;
  if (elapsed < CYCLE_INTERVAL_MS * 0.9) {
    return [];
  }

  queue.cycleNumber++;
  queue.lastCycleAt = now;

  // Extraer lote de K usuarios con mayor prioridad — O(K · log n)
  const batch = queue.waitingHeap.extractBatch(queue.currentK);

  const admittedIds: string[] = [];
  for (const user of batch) {
    user.status = "admitted";
    queue.admittedSet.add(user.id);
    admittedIds.push(user.id);
  }

  queue.lastBatchSize = batch.length;

  return admittedIds;
}

// ---------------------------------------------------------------------------
// 4. AJUSTE DINÁMICO DE K
// ---------------------------------------------------------------------------

/**
 * Reporta una medición de latencia y ajusta K automáticamente.
 */
export function reportLatency(eventId: string, latencyMs: number): void {
  const queue = getOrCreateQueue(eventId);

  queue.recentLatencies.push(latencyMs);
  if (queue.recentLatencies.length > 10) {
    queue.recentLatencies.shift();
  }

  const avgLatency = calcAvgLatency(queue);
  adjustK(queue, avgLatency);
}

function adjustK(queue: EventQueue, avgLatency: number): void {
  let newK: number;

  if (avgLatency >= LATENCY_THRESHOLD_CRITICAL) {
    newK = Math.floor(queue.currentK * K_REDUCTION_FACTOR_CRITICAL);
  } else if (avgLatency >= LATENCY_THRESHOLD_HIGH) {
    newK = Math.floor(queue.currentK * K_REDUCTION_FACTOR_HIGH);
  } else {
    newK = Math.ceil(queue.currentK * K_RECOVERY_FACTOR);
  }

  queue.currentK = Math.max(MIN_K_VALUE, Math.min(MAX_K_VALUE, newK));
}

// ---------------------------------------------------------------------------
// 5. VERIFICAR SI USUARIO FUE ADMITIDO — O(1)
// ---------------------------------------------------------------------------

/**
 * Verifica si un usuario fue admitido.
 *
 * @complexity O(1) — lookup en Set
 */
export function isUserAdmitted(eventId: string, userId: string): boolean {
  const queue = eventQueues.get(eventId);
  if (!queue) return false;
  return queue.admittedSet.has(userId);
}

// ---------------------------------------------------------------------------
// 6. ESTADÍSTICAS (panel admin)
// ---------------------------------------------------------------------------

export function getQueueStats(eventId: string) {
  const queue = getOrCreateQueue(eventId);
  const waiting = queue.waitingHeap.size;
  const admitted = queue.admittedSet.size;
  const avgLatency = calcAvgLatency(queue);

  // Contar fans verificados en la cola actual
  const fansInQueue = queue.waitingHeap
    .toSortedArray()
    .filter((u) => u.isFanVerified).length;

  return {
    eventId,
    totalUsers: waiting + admitted,
    waiting,
    admitted,
    fansInQueue,
    currentK: queue.currentK,
    maxK: MAX_K_VALUE,
    cycleNumber: queue.cycleNumber,
    avgLatency,
    healthStatus: getHealthStatus(avgLatency),
    lastBatchSize: queue.lastBatchSize,
    estimatedCyclesToClear: Math.ceil(waiting / queue.currentK),
    heapSize: queue.waitingHeap.size,
    dataStructure: "MinHeap",
    insertComplexity: "O(log n)",
    extractComplexity: "O(K · log n)",
  };
}

// ---------------------------------------------------------------------------
// 7. LIMPIAR COLAS — O(m · log n) donde m = usuarios expirados
// ---------------------------------------------------------------------------

/**
 * Limpia usuarios expirados (más de 1 hora sin ser admitidos).
 *
 * @complexity O(m · log n) — m remociones del heap
 */
export function cleanupExpired(eventId: string): number {
  const queue = eventQueues.get(eventId);
  if (!queue) return 0;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  let cleaned = 0;

  // Recolectar IDs de usuarios expirados
  const expiredIds: string[] = [];
  for (const [id, user] of queue.allUsers) {
    if (user.status === "waiting" && user.joinedAt < oneHourAgo) {
      expiredIds.push(id);
    }
  }

  // Remover del heap — O(log n) por cada remoción
  for (const id of expiredIds) {
    queue.waitingHeap.remove(id);
    queue.allUsers.delete(id);
    cleaned++;
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// 8. ACTUALIZAR VERIFICACIÓN DE FAN — O(log n)
// ---------------------------------------------------------------------------

/**
 * Marca a un usuario como fan verificado y actualiza su prioridad.
 *
 * Si el usuario ya está en la fila, su peso se recalcula inmediatamente
 * y el heap se reordena en O(log n).
 */
export function verifyFanStatus(
  eventId: string,
  userId: string,
  isFanVerified: boolean
): void {
  const queue = eventQueues.get(eventId);
  if (!queue) return;

  const user = queue.allUsers.get(userId);
  if (!user || user.status !== "waiting") return;

  user.isFanVerified = isFanVerified;
  const newWeight = calculateWeight(user.joinedAt, isFanVerified);
  user.weight = newWeight;

  // Reposicionar en el heap — O(log n)
  queue.waitingHeap.updateWeight(userId, newWeight);
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function calcAvgLatency(queue: EventQueue): number {
  if (queue.recentLatencies.length === 0) return 0;
  return Math.round(
    queue.recentLatencies.reduce((a, b) => a + b, 0) /
      queue.recentLatencies.length
  );
}

function buildCycleState(
  queue: EventQueue,
  secondsUntilNext: number,
  avgLatency: number
): CycleState {
  return {
    cycleNumber: queue.cycleNumber,
    currentK: queue.currentK,
    cycleStartedAt: queue.lastCycleAt,
    nextCycleAt: queue.lastCycleAt + CYCLE_INTERVAL_MS,
    secondsUntilNextCycle: secondsUntilNext,
    lastBatchSize: queue.lastBatchSize,
    totalInQueue: queue.waitingHeap.size,
    recentLatencies: queue.recentLatencies.slice(-5),
    avgLatency,
    healthStatus: getHealthStatus(avgLatency),
  };
}
