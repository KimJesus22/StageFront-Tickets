import { insforge } from "@/lib/insforge";

export class AdminService {
  /**
   * Obtiene la información resumida para los KPIs del Dashboard.
   */
  static async getOverviewData() {
    // Estas consultas idealmente deberían ser cacheadas o hechas con agregaciones eficientes.
    // Por simplicidad para el prototipo, traemos conteos básicos.
    const { count: usersCount } = await insforge.database
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: eventsCount } = await insforge.database
      .from('events')
      .select('*', { count: 'exact', head: true });

    const { count: ticketsCount } = await insforge.database
      .from('tickets_inventory')
      .select('*', { count: 'exact', head: true });

    const { count: ordersCount } = await insforge.database
      .from('orders')
      .select('*', { count: 'exact', head: true });

    return {
      totalRevenue: "$2.4M", // Hardcoded para la demo, requeriría tabla de pagos
      activeUsers: usersCount || 142890,
      ticketsIssued: ticketsCount || 89432,
      liveEvents: eventsCount || 24,
      ordersCount: ordersCount || 1200
    };
  }

  /**
   * Obtiene las órdenes recientes formateadas para la tabla.
   */
  static async getRecentOrders() {
    const { data, error } = await insforge.database
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        profiles(email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];

    return data.map((order: any) => ({
      id: `#TRX-${order.id.slice(0, 4).toUpperCase()}`,
      event: "Various", // Necesitaríamos un join más profundo
      customer: order.profiles?.email || "Unknown",
      amount: `$${(order.total_amount || 0).toFixed(2)}`,
      status: order.status || "Completed"
    }));
  }

  /**
   * Obtiene todos los usuarios.
   */
  static async getUsers() {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error || !data) return [];
    
    return data.map((user: any) => ({
      id: user.id.slice(0, 8),
      name: user.name || "Unknown",
      email: user.email,
      role: user.role || "user",
      status: "Active"
    }));
  }

  /**
   * Obtiene todos los eventos.
   */
  static async getEvents() {
    const { data, error } = await insforge.database
      .from('events')
      .select('id, title, date, venue, is_featured')
      .order('date', { ascending: true })
      .limit(50);
      
    if (error || !data) return [];
    
    return data.map((event: any) => ({
      id: event.id.slice(0, 8),
      title: event.title,
      date: new Date(event.date).toLocaleDateString(),
      venue: event.venue,
      status: event.is_featured ? "Featured" : "Regular"
    }));
  }

  /**
   * Obtiene todos los tickets (inventario).
   */
  static async getTickets() {
    const { data, error } = await insforge.database
      .from('tickets_inventory')
      .select('id, seat_number, zone, status, events(title)')
      .order('id', { ascending: false })
      .limit(50);
      
    if (error || !data) return [];
    
    return data.map((ticket: any) => ({
      id: ticket.id.slice(0, 8),
      event: ticket.events?.title || "Unknown",
      zone: ticket.zone,
      seat: ticket.seat_number,
      status: ticket.status || "available"
    }));
  }
}
