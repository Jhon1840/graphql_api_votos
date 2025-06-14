"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Users,
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  TrendingUp,
  UserCheck,
  Settings,
  Sparkles,
  Award,
  Target,
  Activity,
  Zap,
  Star,
  Crown,
  Medal,
  Loader2,
  ClipboardList,
} from "lucide-react"

// Hooks personalizados
import { useElecciones } from "@/hooks/useElecciones"
import { useCandidatos } from "@/hooks/useCandidatos"
import { useVotantes } from "@/hooks/useVotantes"
import { useVotacion } from "@/hooks/useVotacion"

interface Eleccion {
  id: string
  nombre: string
  fecha: string
  estado: "activa" | "cerrada" | "programada"
}

interface Candidato {
  idCandidato: string
  idEleccion: string
  nombre: string
  partido: string
}

interface Votante {
  carnet: string
  nombre: string
  haVotado: boolean
}

interface ResultadoVotacion {
  idCandidato: string
  nombreCandidato: string
  partido: string
  totalVotos: number
}

export default function SistemaVotacion() {
  // Hooks personalizados
  const { elecciones, loading: loadingElecciones, registrarEleccion } = useElecciones()
  const { candidatos, loading: loadingCandidatos, registrarCandidato, obtenerCandidatosPorEleccion } = useCandidatos()
  const { votantes, loading: loadingVotantes, registrarVotante, verificarVotante, marcarComoVotado } = useVotantes()
  const { loading: loadingVotacion, resultados, votar, obtenerResultados } = useVotacion()

  // Estados locales
  const [mensaje, setMensaje] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")

  // Formularios
  const [nuevaEleccion, setNuevaEleccion] = useState({ nombre: "", fecha: "" })
  const [nuevoCandidato, setNuevoCandidato] = useState({ idEleccion: "", nombre: "", partido: "" })
  const [nuevoVotante, setNuevoVotante] = useState({ carnet: "", nombre: "" })
  const [votacion, setVotacion] = useState({ carnet: "", idEleccion: "", idCandidato: "" })

  // Verificar elecciones cerradas cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      // Esta lógica se mantiene igual para el demo
      // En producción, esto debería venir del servidor
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Cargar resultados cuando cambie la elección
  useEffect(() => {
    const cargarResultados = async () => {
      const eleccionesActivas = elecciones.filter((e: Eleccion) => e.id && e.estado === "activa")
      if (eleccionesActivas.length > 0) {
        console.log("Cargando resultados para elección:", eleccionesActivas[0].id) // Debug log
        await obtenerResultados(eleccionesActivas[0].id)
      } else {
        console.log("No hay elecciones activas") // Debug log
      }
    }
    
    cargarResultados()
  }, [elecciones, obtenerResultados])

  // Funciones
  const mostrarMensaje = (msg: string) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(""), 4000)
  }

  const handleRegistrarEleccion = async () => {
    if (!nuevaEleccion.nombre || !nuevaEleccion.fecha) {
      mostrarMensaje("Por favor complete todos los campos")
      return
    }

    // Convert the date string to a Date object and format it as ISO string
    const fechaObj = new Date(nuevaEleccion.fecha)
    // Set the time to noon UTC to avoid timezone issues
    fechaObj.setUTCHours(12, 0, 0, 0)
    const fechaISO = fechaObj.toISOString()

    console.log('Fecha original:', nuevaEleccion.fecha)
    console.log('Fecha convertida:', fechaISO)

    const result = await registrarEleccion(nuevaEleccion.nombre, fechaISO)
    mostrarMensaje(result.message)

    if (result.success) {
      setNuevaEleccion({ nombre: "", fecha: "" })
    }
  }

  const handleRegistrarCandidato = async () => {
    if (!nuevoCandidato.idEleccion || !nuevoCandidato.nombre || !nuevoCandidato.partido) {
      mostrarMensaje("Por favor complete todos los campos")
      return
    }

    const result = await registrarCandidato(nuevoCandidato.idEleccion, nuevoCandidato.nombre, nuevoCandidato.partido)
    mostrarMensaje(result.message)

    if (result.success) {
      setNuevoCandidato({ idEleccion: "", nombre: "", partido: "" })
    }
  }

  const handleRegistrarVotante = async () => {
    if (!nuevoVotante.carnet || !nuevoVotante.nombre) {
      mostrarMensaje("Por favor complete todos los campos")
      return
    }

    const result = await registrarVotante(nuevoVotante.carnet, nuevoVotante.nombre)
    mostrarMensaje(result.message)

    if (result.success) {
      setNuevoVotante({ carnet: "", nombre: "" })
    }
  }

  const handleEmitirVoto = async () => {
    if (!votacion.carnet || !votacion.idEleccion || !votacion.idCandidato) {
      mostrarMensaje("Por favor complete todos los campos")
      return
    }

    // Verificar votante
    const votante = await verificarVotante(votacion.carnet)
    if (!votante) {
      mostrarMensaje("❌ Carnet no encontrado")
      return
    }

    if (votante.haVotado) {
      mostrarMensaje("❌ Este votante ya ha emitido su voto")
      return
    }

    const eleccion = elecciones.find((e: Eleccion) => e.id === votacion.idEleccion)
    if (!eleccion || eleccion.estado !== "activa") {
      mostrarMensaje("❌ La elección no está activa")
      return
    }

    const result = await votar(votacion.idEleccion, votacion.carnet, votacion.idCandidato)
    mostrarMensaje(result.message)

    if (result.success) {
      marcarComoVotado(votacion.carnet)
      setVotacion({ carnet: "", idEleccion: "", idCandidato: "" })
      // Actualizar resultados
      obtenerResultados(votacion.idEleccion)
    }
  }

  const getTiempoRestante = (fecha: string) => {
    const fechaEleccion = new Date(fecha)
    const fechaCierre = new Date(fechaEleccion.getTime() + 24 * 60 * 60 * 1000)
    const ahora = new Date()
    const diferencia = fechaCierre.getTime() - ahora.getTime()

    if (diferencia <= 0) return "Cerrada"

    const horas = Math.floor(diferencia / (1000 * 60 * 60))
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60))

    return `${horas}h ${minutos}m restantes`
  }

  const getEstadisticasGenerales = () => {
    const totalVotos = resultados.reduce((sum: number, r: ResultadoVotacion) => sum + r.totalVotos, 0)
    const totalVotantes = votantes.length
    const votantesQueVotaron = votantes.filter((v) => v.haVotado).length
    const participacion = totalVotantes > 0 ? (votantesQueVotaron / totalVotantes) * 100 : 0
    const eleccionesActivas = elecciones.filter((e: Eleccion) => e.estado === "activa").length

    return {
      totalVotos,
      totalVotantes,
      votantesQueVotaron,
      participacion,
      eleccionesActivas,
      totalCandidatos: candidatos.length,
    }
  }

  const stats = getEstadisticasGenerales()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <Vote className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Sistema de Votación Estudiantil
              </h1>
            </div>
            <p className="text-blue-100 text-lg">Democracia digital para el futuro estudiantil</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {mensaje && (
          <Alert className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 animate-in slide-in-from-top duration-300">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">{mensaje}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border shadow-lg rounded-xl p-2">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="elecciones"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Calendar className="h-4 w-4" />
              Elecciones
            </TabsTrigger>
            <TabsTrigger
              value="candidatos"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Users className="h-4 w-4" />
              Candidatos
            </TabsTrigger>
            <TabsTrigger
              value="votantes"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <UserCheck className="h-4 w-4" />
              Votantes
            </TabsTrigger>
            <TabsTrigger
              value="votar"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Vote className="h-4 w-4" />
              Votar
            </TabsTrigger>
            <TabsTrigger
              value="resultados"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Trophy className="h-4 w-4" />
              Resultados
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Votos</p>
                      <p className="text-3xl font-bold">{stats.totalVotos}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Vote className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Participación</p>
                      <p className="text-3xl font-bold">{stats.participacion.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Votantes</p>
                      <p className="text-3xl font-bold">{stats.totalVotantes}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Elecciones Activas</p>
                      <p className="text-3xl font-bold">{stats.eleccionesActivas}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Zap className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de elecciones activas */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Elecciones en Curso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {elecciones
                      .filter((e: Eleccion) => e.estado === "activa")
                      .map((eleccion: Eleccion) => (
                        <div
                          key={eleccion.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-800">{eleccion.nombre}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTiempoRestante(eleccion.fecha)}
                            </p>
                          </div>
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activa
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Progreso de Votación
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Participación General</span>
                        <span className="text-sm font-bold text-gray-900">{stats.participacion.toFixed(1)}%</span>
                      </div>
                      <Progress value={stats.participacion} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{stats.votantesQueVotaron}</p>
                        <p className="text-sm text-green-700">Han Votado</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-600">
                          {stats.totalVotantes - stats.votantesQueVotaron}
                        </p>
                        <p className="text-sm text-gray-700">Pendientes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Registro de Elecciones */}
          <TabsContent value="elecciones">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Registrar Nueva Elección
                  </CardTitle>
                  <CardDescription className="text-blue-100">Crear una nueva elección estudiantil</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre-eleccion" className="text-sm font-semibold text-gray-700">
                      Nombre de la Elección
                    </Label>
                    <Input
                      id="nombre-eleccion"
                      value={nuevaEleccion.nombre}
                      onChange={(e) => setNuevaEleccion({ ...nuevaEleccion, nombre: e.target.value })}
                      placeholder="Ej: Elección Estudiantil 2025"
                      className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                      disabled={loadingElecciones}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-eleccion" className="text-sm font-semibold text-gray-700">
                      Fecha de Inicio
                    </Label>
                    <Input
                      id="fecha-eleccion"
                      type="date"
                      value={nuevaEleccion.fecha}
                      onChange={(e) => setNuevaEleccion({ ...nuevaEleccion, fecha: e.target.value })}
                      className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                      disabled={loadingElecciones}
                    />
                  </div>
                  <Button
                    onClick={handleRegistrarEleccion}
                    disabled={loadingElecciones}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loadingElecciones ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Registrar Elección
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Elecciones Registradas
                  </CardTitle>
                  <CardDescription className="text-indigo-100">Lista de todas las elecciones</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {elecciones.map((eleccion: Eleccion) => (
                      <div
                        key={eleccion.id}
                        className="group p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                              {eleccion.nombre}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              📅{" "}
                              {new Date(eleccion.fecha).toLocaleDateString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            {eleccion.estado === "activa" && (
                              <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                                <Clock className="h-3 w-3" />
                                {getTiempoRestante(eleccion.fecha)}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={`ml-4 ${
                              eleccion.estado === "activa"
                                ? "bg-green-500 hover:bg-green-600"
                                : eleccion.estado === "cerrada"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : "bg-yellow-500 hover:bg-yellow-600"
                            }`}
                          >
                            {eleccion.estado === "activa" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {eleccion.estado === "cerrada" && <XCircle className="h-3 w-3 mr-1" />}
                            {eleccion.estado === "programada" && <Clock className="h-3 w-3 mr-1" />}
                            {eleccion.estado.charAt(0).toUpperCase() + eleccion.estado.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Registro de Candidatos */}
          <TabsContent value="candidatos">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registrar Candidato
                  </CardTitle>
                  <CardDescription className="text-purple-100">Agregar candidato a una elección</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="eleccion-candidato" className="text-sm font-semibold text-gray-700">
                      Elección
                    </Label>
                    <Select
                      value={nuevoCandidato.idEleccion}
                      onValueChange={(value) => setNuevoCandidato({ ...nuevoCandidato, idEleccion: value })}
                      disabled={loadingCandidatos}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-purple-500 rounded-lg">
                        <SelectValue placeholder="Seleccionar elección" />
                      </SelectTrigger>
                      <SelectContent>
                        {elecciones.map((eleccion: Eleccion) => (
                          <SelectItem key={eleccion.id} value={eleccion.id}>
                            {eleccion.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre-candidato" className="text-sm font-semibold text-gray-700">
                      Nombre del Candidato
                    </Label>
                    <Input
                      id="nombre-candidato"
                      value={nuevoCandidato.nombre}
                      onChange={(e) => setNuevoCandidato({ ...nuevoCandidato, nombre: e.target.value })}
                      placeholder="Nombre completo"
                      className="border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                      disabled={loadingCandidatos}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partido-candidato" className="text-sm font-semibold text-gray-700">
                      Partido/Lista
                    </Label>
                    <Input
                      id="partido-candidato"
                      value={nuevoCandidato.partido}
                      onChange={(e) => setNuevoCandidato({ ...nuevoCandidato, partido: e.target.value })}
                      placeholder="Ej: Lista Verde"
                      className="border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                      disabled={loadingCandidatos}
                    />
                  </div>
                  <Button
                    onClick={handleRegistrarCandidato}
                    disabled={loadingCandidatos}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loadingCandidatos ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Registrar Candidato
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Candidatos Registrados
                  </CardTitle>
                  <CardDescription className="text-indigo-100">Lista de todos los candidatos</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {elecciones.map((eleccion: Eleccion) => (
                      <div key={eleccion.id}>
                        <CardContent className="p-6">
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {candidatos
                              .filter((c: Candidato) => c.idEleccion === eleccion.id)
                              .map((candidato: Candidato, index: number) => (
                                <div
                                  key={candidato.idCandidato}
                                  className={`group p-6 border-3 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                    votacion.idCandidato === candidato.idCandidato
                                      ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl"
                                      : "border-gray-300 hover:border-green-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg"
                                  }`}
                                  onClick={() => setVotacion((prev) => ({ ...prev, idCandidato: candidato.idCandidato }))}
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                                        index === 0
                                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                          : index === 1
                                            ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                                            : "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                                      }`}
                                    >
                                      {candidato.nombre.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                                        {candidato.nombre}
                                      </h4>
                                      <p className="text-sm text-purple-600 font-medium">{candidato.partido}</p>
                                      <p className="text-xs text-gray-500">📊 {eleccion?.nombre}</p>
                                    </div>
                                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                      Candidato #{index + 1}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Registro de Votantes */}
          <TabsContent value="votantes">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Registrar Votante
                  </CardTitle>
                  <CardDescription className="text-green-100">Agregar nuevo votante al sistema</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="carnet-votante" className="text-sm font-semibold text-gray-700">
                      Carnet/CI
                    </Label>
                    <Input
                      id="carnet-votante"
                      value={nuevoVotante.carnet}
                      onChange={(e) => setNuevoVotante({ ...nuevoVotante, carnet: e.target.value })}
                      placeholder="Ej: EST001"
                      className="border-2 border-gray-200 focus:border-green-500 rounded-lg"
                      disabled={loadingVotantes}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre-votante" className="text-sm font-semibold text-gray-700">
                      Nombre Completo
                    </Label>
                    <Input
                      id="nombre-votante"
                      value={nuevoVotante.nombre}
                      onChange={(e) => setNuevoVotante({ ...nuevoVotante, nombre: e.target.value })}
                      placeholder="Nombre completo del votante"
                      className="border-2 border-gray-200 focus:border-green-500 rounded-lg"
                      disabled={loadingVotantes}
                    />
                  </div>
                  <Button
                    onClick={handleRegistrarVotante}
                    disabled={loadingVotantes}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loadingVotantes ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Registrar Votante
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Votantes Registrados
                  </CardTitle>
                  <CardDescription className="text-blue-100">Lista de votantes habilitados</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {votantes.map((votante) => (
                      <div
                        key={votante.carnet}
                        className="group p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-green-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                                votante.haVotado
                                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                  : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                              }`}
                            >
                              {votante.nombre.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                                {votante.nombre}
                              </h4>
                              <p className="text-sm text-gray-600">🆔 {votante.carnet}</p>
                            </div>
                          </div>
                          <Badge
                            className={
                              votante.haVotado ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"
                            }
                          >
                            {votante.haVotado ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Votó
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sistema de Votación */}
          <TabsContent value="votar">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white rounded-t-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-white/20 p-4 rounded-full">
                        <Vote className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Emitir Voto</CardTitle>
                    <CardDescription className="text-green-100 text-lg">
                      Tu voz cuenta - Ejerce tu derecho democrático
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-2">
                    <Label
                      htmlFor="carnet-voto"
                      className="text-lg font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <UserCheck className="h-5 w-5" />
                      Carnet/CI del Votante
                    </Label>
                    <Input
                      id="carnet-voto"
                      value={votacion.carnet}
                      onChange={(e) => setVotacion({ ...votacion, carnet: e.target.value })}
                      placeholder="Ingrese su carnet"
                      className="border-2 border-gray-300 focus:border-green-500 rounded-lg text-lg p-4"
                      disabled={loadingVotacion}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="eleccion-voto"
                      className="text-lg font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Calendar className="h-5 w-5" />
                      Elección
                    </Label>
                    <Select
                      value={votacion.idEleccion}
                      onValueChange={(value) => setVotacion({ ...votacion, idEleccion: value, idCandidato: "" })}
                      disabled={loadingVotacion}
                    >
                      <SelectTrigger className="border-2 border-gray-300 focus:border-green-500 rounded-lg text-lg p-4">
                        <SelectValue placeholder="Seleccionar elección" />
                      </SelectTrigger>
                      <SelectContent>
                        {elecciones
                          .filter((e: Eleccion) => e.estado === "activa")
                          .map((eleccion: Eleccion) => (
                            <SelectItem key={eleccion.id} value={eleccion.id}>
                              {eleccion.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {votacion.idEleccion && (
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Selecciona tu Candidato
                      </Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {candidatos
                          .filter((c: Candidato) => c.idEleccion === votacion.idEleccion)
                          .map((candidato: Candidato, index: number) => (
                            <div
                              key={candidato.idCandidato}
                              className={`group p-6 border-3 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                votacion.idCandidato === candidato.idCandidato
                                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl"
                                  : "border-gray-300 hover:border-green-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg"
                              }`}
                              onClick={() => setVotacion((prev) => ({ ...prev, idCandidato: candidato.idCandidato }))}
                            >
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`w-6 h-6 rounded-full border-3 transition-all duration-300 ${
                                    votacion.idCandidato === candidato.idCandidato
                                      ? "border-green-500 bg-green-500 shadow-lg"
                                      : "border-gray-400 group-hover:border-green-400"
                                  }`}
                                >
                                  {votacion.idCandidato === candidato.idCandidato && (
                                    <CheckCircle className="w-6 h-6 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div
                                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                                        index === 0
                                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                          : index === 1
                                            ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                                            : "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                                      }`}
                                    >
                                      {candidato.nombre.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-lg text-gray-800 group-hover:text-green-600 transition-colors">
                                        {candidato.nombre}
                                      </h4>
                                      <p className="text-sm font-medium text-gray-600">{candidato.partido}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleEmitirVoto}
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-6 text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                    disabled={!votacion.carnet || !votacion.idEleccion || !votacion.idCandidato || loadingVotacion}
                  >
                    {loadingVotacion ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                        Emitiendo Voto...
                      </>
                    ) : (
                      <>
                        <Vote className="h-6 w-6 mr-3" />
                        Emitir Voto Oficial
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resultados */}
          <TabsContent value="resultados">
            <div className="space-y-8">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white rounded-t-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-white/20 p-4 rounded-full">
                        <Trophy className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Resultados a Boca de Urna</CardTitle>
                    <CardDescription className="text-orange-100 text-lg">
                      Resultados en tiempo real de las elecciones
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              {elecciones.filter((e: Eleccion) => e.estado === "activa").map((eleccion: Eleccion) => {
                const totalVotos = resultados.reduce((sum: number, r: ResultadoVotacion) => sum + r.totalVotos, 0)
                const votantesHabilitados = votantes.length
                const participacion = votantesHabilitados > 0 ? (totalVotos / votantesHabilitados) * 100 : 0

                return (
                  <Card key={eleccion.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Award className="h-6 w-6" />
                            {eleccion.nombre}
                          </CardTitle>
                          <CardDescription className="text-indigo-100">
                            📅{" "}
                            {new Date(eleccion.fecha).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`text-lg px-4 py-2 ${
                            eleccion.estado === "activa"
                              ? "bg-green-500 hover:bg-green-600"
                              : eleccion.estado === "cerrada"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-yellow-500 hover:bg-yellow-600"
                          }`}
                        >
                          {eleccion.estado === "activa" && <Zap className="h-4 w-4 mr-1" />}
                          {eleccion.estado === "cerrada" && <XCircle className="h-4 w-4 mr-1" />}
                          {eleccion.estado.charAt(0).toUpperCase() + eleccion.estado.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="text-center bg-white/20 rounded-lg p-4">
                          <p className="text-3xl font-bold">{totalVotos}</p>
                          <p className="text-indigo-100 font-medium">Votos Emitidos</p>
                        </div>
                        <div className="text-center bg-white/20 rounded-lg p-4">
                          <p className="text-3xl font-bold">{votantesHabilitados}</p>
                          <p className="text-indigo-100 font-medium">Votantes Habilitados</p>
                        </div>
                        <div className="text-center bg-white/20 rounded-lg p-4">
                          <p className="text-3xl font-bold">{participacion.toFixed(1)}%</p>
                          <p className="text-indigo-100 font-medium">Participación</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8">
                      {eleccion.estado === "activa" && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <p className="text-blue-800 font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5" />⏰ {getTiempoRestante(eleccion.fecha)}
                          </p>
                        </div>
                      )}

                      {resultados.length > 0 ? (
                        <div className="space-y-6">
                          {resultados.map((resultado: ResultadoVotacion, index: number) => {
                            const porcentaje = totalVotos > 0 ? (resultado.totalVotos / totalVotos) * 100 : 0
                            return (
                              <div
                                key={resultado.idCandidato}
                                className="group p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl ${
                                        index === 0
                                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                          : index === 1
                                            ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                            : index === 2
                                              ? "bg-gradient-to-br from-orange-500 to-orange-700"
                                              : "bg-gradient-to-br from-blue-500 to-blue-700"
                                      }`}
                                    >
                                      {index === 0 ? (
                                        <Crown className="h-8 w-8" />
                                      ) : index === 1 ? (
                                        <Medal className="h-8 w-8" />
                                      ) : index === 2 ? (
                                        <Award className="h-8 w-8" />
                                      ) : (
                                        index + 1
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-xl text-gray-800 group-hover:text-blue-600 transition-colors">
                                        {resultado.nombreCandidato}
                                      </h4>
                                      <p className="text-lg text-gray-600 font-medium">{resultado.partido}</p>
                                      {index === 0 && totalVotos > 0 && (
                                        <Badge className="bg-yellow-500 hover:bg-yellow-600 mt-2">
                                          <Crown className="h-3 w-3 mr-1" />
                                          Líder
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-800">{resultado.totalVotos}</p>
                                    <p className="text-lg text-gray-600 font-medium">votos</p>
                                    <p className="text-2xl font-bold text-blue-600">{porcentaje.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <Progress value={porcentaje} className="h-4 bg-gray-200" />
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="bg-gray-50 rounded-full p-4 inline-block mb-4">
                            <ClipboardList className="h-12 w-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay resultados disponibles</h3>
                          <p className="text-gray-500">Los resultados se mostrarán cuando se emitan votos</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {elecciones.filter((e: Eleccion) => e.estado === "activa").length === 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <div className="bg-gray-50 rounded-full p-4 inline-block mb-4">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay elecciones activas</h3>
                    <p className="text-gray-500">Los resultados se mostrarán cuando haya una elección activa</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
