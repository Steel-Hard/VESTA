import { StyleSheet } from "react-native";


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  header: {
    backgroundColor: "#4A5568",
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },

  // Perfil
  profileCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
  },
  profileContent: { alignItems: "center" },
  photoContainer: { position: "relative" },
  photoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#CBD5E0",
  },
  statusIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },
  profileInfo: { alignItems: "center" },
  elderName: { color: "#1A202C", fontSize: 24, fontWeight: "bold" },
  elderAge: { color: "#4A5568", fontSize: 18 },
  monitoringDate: { color: "#718096", fontSize: 14 },

  // Segurança
  safetySection: { marginBottom: 24 },
  safetyButton: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safetyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  safetyButtonTitle: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    marginLeft: 12,
  },
  safetyButtonSubtitle: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
    opacity: 0.9,
  },

  // Saúde
  heartSection: { marginBottom: 24 },
  sectionTitle: {
    color: "#1A202C",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  heartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  heartContent: { flexDirection: "row", alignItems: "center" },
  heartIconContainer: { marginRight: 24 },
  heartIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FED7D7",
    alignItems: "center",
    justifyContent: "center",
  },
  heartInfo: { flex: 1 },
  heartRateContainer: { flexDirection: "row", alignItems: "baseline" },
  heartRateText: { fontSize: 36, fontWeight: "bold" },
  bpmText: { color: "#4A5568", fontSize: 18, marginLeft: 8 },
  heartRateLabel: { color: "#4A5568", fontSize: 14, marginTop: 4 },
  lastUpdate: { color: "#718096", fontSize: 12, marginTop: 8 },
  progressContainer: { marginTop: 16 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { color: "#718096", fontSize: 12 },
  progressBar: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },

  // Dispositivo
  deviceSection: { marginBottom: 24 },
  deviceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceInfo: { flexDirection: "row", alignItems: "center" },
  deviceLabel: { color: "#1A202C", fontWeight: "600", marginLeft: 12 },
  deviceStatus: { fontWeight: "bold" },
  syncInfo: { paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  syncText: { color: "#4A5568", fontSize: 14, textAlign: "center" },

  // Botão teste
  testButtonContainer: { marginBottom: 32 },
  outlineButton: {
    borderWidth: 2,
    borderColor: "#4A5568",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  outlineButtonText: { color: "#4A5568", fontSize: 16, fontWeight: "bold" },
});

export default styles;