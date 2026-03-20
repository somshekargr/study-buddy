import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageSquare, Layout, BrainCircuit, ChevronLeft, FileText } from 'lucide-react-native';
import ChatPanel from '../components/ChatPanel';
import QuizPanel from '../components/QuizPanel';
import KnowledgeMap from '../components/KnowledgeMap';
import PDFViewer from '../components/PDFViewer';

const Tab = createBottomTabNavigator();

// Components for tabs
function PdfTab({ route }: any) {
    const { documentId } = route.params;
    return <PDFViewer documentId={documentId} />;
}
function ChatTab({ route }: any) {
    const { documentId } = route.params;
    return <ChatPanel documentId={documentId} />;
}

function QuizTab({ route }: any) {
    const { documentId } = route.params;
    return <QuizPanel documentId={documentId} />;
}

function GraphTab({ route }: any) {
    const { documentId } = route.params;
    return <KnowledgeMap documentId={documentId} />;
}

export default function DocumentDetailScreen({ route, navigation }: any) {
    const { documentId, filename } = route.params;

    return (
        <View className="flex-1 bg-slate-900">
            {/* Custom Header */}
            <View className="pt-12 px-4 pb-4 bg-slate-800 border-b border-slate-700">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg" numberOfLines={1}>{filename}</Text>
                        <Text className="text-slate-400 text-xs">Document Analysis</Text>
                    </View>
                </View>
            </View>

            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#1e293b',
                        borderTopColor: '#334155',
                        height: 60,
                        paddingBottom: 8,
                    },
                    tabBarActiveTintColor: '#3b82f6',
                    tabBarInactiveTintColor: '#94a3b8',
                }}
            >
                <Tab.Screen
                    name="PDF"
                    component={PdfTab}
                    initialParams={{ documentId }}
                    options={{
                        tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Chat"
                    component={ChatTab}
                    initialParams={{ documentId }}
                    options={{
                        tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Quiz"
                    component={QuizTab}
                    initialParams={{ documentId }}
                    options={{
                        tabBarIcon: ({ color, size }) => <Layout size={size} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Graph"
                    component={GraphTab}
                    initialParams={{ documentId }}
                    options={{
                        tabBarIcon: ({ color, size }) => <BrainCircuit size={size} color={color} />,
                    }}
                />
            </Tab.Navigator>
        </View>
    );
}
