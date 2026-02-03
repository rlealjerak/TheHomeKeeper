import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'home',
    title: 'Welcome to TheHomeKeeper',
    description: 'Track your home maintenance effortlessly and never miss important tasks.',
  },
  {
    id: '2',
    icon: 'bell',
    title: 'Never Miss Maintenance',
    description: 'Get reminders before tasks are due so you can stay on top of your home care.',
  },
  {
    id: '3',
    icon: 'check-circle',
    title: 'You\'re All Set!',
    description: 'Let\'s start adding your first item and keeping your home in perfect condition.',
  },
];

// Onboarding screen - shows on first launch after sign-up
const Onboarding = ({ onComplete }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Onboarding completion is saved to Firestore by AppNavigator (per-account)
  const handleComplete = () => {
    onComplete();
  };

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, index === 2 && styles.iconCircleSuccess]}>
          <Icon
            name={item.icon}
            size={80}
            color={index === 2 ? colors.success : colors.primary}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 24, 10],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    },
    slide: {
      width: width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconContainer: {
      marginBottom: 48,
    },
    iconCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCircleSuccess: {
      backgroundColor: colors.secondaryLight,
    },
    content: {
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 36,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginHorizontal: 4,
    },
    footer: {
      paddingHorizontal: 40,
      paddingBottom: 40,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    skipText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    nextButton: {
      flex: 1,
      marginLeft: 16,
    },
    getStartedButton: {
      width: '100%',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo at top */}
      <View style={styles.header}>
        <Logo size="small" />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Pagination dots */}
      {renderPagination()}

      {/* Bottom buttons */}
      <View style={styles.footer}>
        {currentIndex < slides.length - 1 ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <Button
              title="Next"
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        ) : (
          <Button
            title="Get Started"
            onPress={handleComplete}
            style={styles.getStartedButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};


export default Onboarding;
