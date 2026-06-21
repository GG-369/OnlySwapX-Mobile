import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SkillWithUser, SkillResponse } from "../../types";
import { Badge } from "../ui/Badge";

// Temporary local replacement for missing SkillTypeBadge export
function SkillTypeBadge({ type }: { type: string }) {
  return <Badge variant="neutral">{type}</Badge>;
}
import { Avatar } from "../ui/Avatar";
import { Trash2 } from "lucide-react-native";

const catIcons: Record<string, string> = {
  TECNOLOGIA: "💻",
  CIENCIAS: "🔬",
  HUMANIDADES: "📚",
  ARTE: "🎨",
  IDIOMAS: "🗣️",
  NEGOCIOS: "📊",
  OTRO: "✦",
};

interface SkillCardProps {
  skill: SkillWithUser | SkillResponse;
  onPropose?: (userId: number, userName: string) => void;
  onDelete?: (id: number) => void;
  currentUserId?: number;
}

export function SkillCard({ skill, onPropose, onDelete, currentUserId }: SkillCardProps) {
  // Comprobación de tipo para ver si el objeto tiene la propiedad "user"
  const user = "user" in skill ? skill.user : undefined;
  const isOwn = currentUserId && skill.userId === currentUserId;

  return (
    <View style={styles.cardContainer}>
      
      {/* Etiqueta Superior */}
      <View style={styles.headerRow}>
        <SkillTypeBadge type={skill.skillType} />
        {skill.category && (
          <Text style={styles.categoryText}>
            {catIcons[skill.category] ?? "✦"} {skill.category}
          </Text>
        )}
      </View>

      {/* Título y Descripción */}
      <Text style={styles.title} numberOfLines={1}>{skill.name}</Text>
      
      {skill.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {skill.description}
        </Text>
      ) : (
        <View style={styles.emptyDesc} />
      )}

      {/* Nivel */}
      <View style={styles.levelContainer}>
        {skill.level && <Badge variant="neutral">{skill.level}</Badge>}
      </View>

      {/* Footer del Usuario */}
      {user && (
        <View style={styles.footerContainer}>
          <View style={styles.userInfoRow}>
            <Avatar name={user.fullName} size="sm" />
            <View style={styles.userInfoText}>
              <Text style={styles.userName} numberOfLines={1}>{user.fullName}</Text>
              {user.university && (
                <Text style={styles.userUni} numberOfLines={1}>{user.university}</Text>
              )}
            </View>
          </View>
          
          {/* Botón de Proponer (Solo si no es propio) */}
          {!isOwn && onPropose && (
            <TouchableOpacity 
              style={styles.proposeBtn} 
              onPress={() => onPropose(user.id!, user.fullName)}
            >
              <Text style={styles.proposeText}>Proponer ↗</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botón de Borrar (Solo si es propio) */}
      {isOwn && onDelete && (
        <View style={styles.deleteContainer}>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => onDelete(skill.id)}
          >
            <Trash2 size={14} color="#ef4444" />
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1e293b', // bg-secondary
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155', // border
    padding: 15,
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryText: {
    color: '#cbd5e1', // text-secondary
    fontSize: 12,
  },
  title: {
    color: '#f8fafc', // text-primary
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
    flex: 1, // Para que empuje el contenido hacia abajo
  },
  emptyDesc: {
    height: 10,
    flex: 1,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  userInfoText: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userUni: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  proposeBtn: {
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)', // primary con opacidad
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  proposeText: {
    color: '#3b82f6', // primary claro
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteContainer: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    marginTop: 15,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: {
    color: '#ef4444', // danger
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  }
});